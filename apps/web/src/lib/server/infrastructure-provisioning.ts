import "server-only";

import { Octokit } from "@octokit/rest";

import { requireDatabase } from "@/lib/server/prisma";

export type GitOpsProvisionEnvironment = "dev" | "stage" | "prod";

export type GitOpsResourceId = "postgresql" | "redis" | "s3-bucket" | "sqs-queue" | "dynamodb-table";

export type GitOpsProvisionRequestInput = {
  resourceId: GitOpsResourceId;
  resourceName: string;
  teamName: string;
  teamSlug: string;
  environment: GitOpsProvisionEnvironment;
  costCenter?: string;
  serviceId?: string;
  serviceName?: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryUrl?: string;
  requester: string;
  requesterEmail: string;
  parameters?: Record<string, string | number | boolean>;
};

export type GitOpsProvisionResult = {
  requestId: string;
  resourceType: string;
  claimName: string;
  claimKind: string;
  claimPath: string;
  branch: string;
  commitSha: string;
  prUrl: string;
  prNumber: number;
  status: string;
  gitOpsStatus: string;
  provisioningStatus: string;
  clusterStatus: string;
  manifest: string;
};

type RepositoryContentFile = {
  type: "file";
  content?: string;
  encoding?: string;
  sha?: string;
};

type ClaimDefinition = {
  id: GitOpsResourceId;
  displayName: string;
  kind: string;
  compositionRef: string;
  defaultParameters: Record<string, string | number | boolean>;
};

const apiVersion = "platform.ohanyere.com/v1alpha1";
const defaultBranchFallback = "main";

export const gitOpsClaimDefinitions: Record<GitOpsResourceId, ClaimDefinition> = {
  postgresql: {
    id: "postgresql",
    displayName: "PostgreSQL",
    kind: "PostgreSQLInstance",
    compositionRef: "postgresql.aws.platform.ohanyere.com",
    defaultParameters: {
      region: "us-east-1",
      storageGB: 20,
      instanceClass: "db.t4g.micro",
      deletionPolicy: "Orphan"
    }
  },
  redis: {
    id: "redis",
    displayName: "Redis",
    kind: "RedisInstance",
    compositionRef: "redis.aws.platform.ohanyere.com",
    defaultParameters: {
      region: "us-east-1",
      nodeType: "cache.t4g.micro",
      numCacheNodes: 1,
      deletionPolicy: "Orphan"
    }
  },
  "s3-bucket": {
    id: "s3-bucket",
    displayName: "S3 Bucket",
    kind: "ObjectBucket",
    compositionRef: "objectbucket.aws.platform.ohanyere.com",
    defaultParameters: {
      region: "us-east-1",
      versioning: true,
      deletionPolicy: "Orphan"
    }
  },
  "sqs-queue": {
    id: "sqs-queue",
    displayName: "SQS Queue",
    kind: "MessageQueue",
    compositionRef: "messagequeue.aws.platform.ohanyere.com",
    defaultParameters: {
      region: "us-east-1",
      fifo: false,
      visibilityTimeoutSeconds: 30,
      deletionPolicy: "Orphan"
    }
  },
  "dynamodb-table": {
    id: "dynamodb-table",
    displayName: "DynamoDB Table",
    kind: "DynamoDBTable",
    compositionRef: "dynamodb.aws.platform.ohanyere.com",
    defaultParameters: {
      region: "us-east-1",
      hashKey: "id",
      billingMode: "PAY_PER_REQUEST",
      deletionPolicy: "Orphan"
    }
  }
};

export class InfrastructureProvisioningConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InfrastructureProvisioningConfigurationError";
  }
}

export class InfrastructureProvisioningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InfrastructureProvisioningError";
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new InfrastructureProvisioningConfigurationError(`Missing required environment variable: ${name}.`);
  }

  return value;
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "resource";
}

function namespaceFor(input: GitOpsProvisionRequestInput) {
  const owner = input.serviceId ? slug(input.serviceId) : slug(input.teamSlug || input.teamName);
  return `${owner}-${input.environment}`;
}

function claimPath(environment: GitOpsProvisionEnvironment, claimName: string) {
  return `k8s/overlays/${environment}/claims/${claimName}.yaml`;
}

function yamlValue(value: string | number | boolean) {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (/^[a-zA-Z0-9._/-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function buildClaimManifest(input: GitOpsProvisionRequestInput, definition: ClaimDefinition, claimName: string) {
  const namespace = namespaceFor(input);
  const costCenter = input.costCenter?.trim() || `cc-${slug(input.teamSlug || input.teamName)}`;
  const parameters = {
    ...definition.defaultParameters,
    ...(input.parameters ?? {})
  };
  const labels: Record<string, string> = {
    "platform.io/team": slug(input.teamSlug || input.teamName),
    "platform.io/cost-center": costCenter,
    "platform.io/environment": input.environment,
    "platform.io/provisioned-by": "nexus-platform"
  };

  if (input.serviceId) {
    labels["platform.io/service"] = slug(input.serviceId);
  }

  return [
    `apiVersion: ${apiVersion}`,
    `kind: ${definition.kind}`,
    "metadata:",
    `  name: ${claimName}`,
    `  namespace: ${namespace}`,
    "  labels:",
    ...Object.entries(labels).map(([key, value]) => `    ${key}: ${yamlValue(value)}`),
    "spec:",
    "  compositionRef:",
    `    name: ${definition.compositionRef}`,
    "  parameters:",
    ...Object.entries(parameters).map(([key, value]) => `    ${key}: ${yamlValue(value)}`),
    ""
  ].join("\n");
}

function toBase64(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

function fromBase64(content: string) {
  return Buffer.from(content, "base64").toString("utf8");
}

function getGitHubErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown GitHub API error.";
}

function getGitHubErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return error.status;
  }

  return undefined;
}

function repositoryUrl(owner: string, repo: string) {
  return `https://github.com/${owner}/${repo}`;
}

export function isGitOpsResourceId(value: string): value is GitOpsResourceId {
  return value in gitOpsClaimDefinitions;
}

export function supportedGitOpsResourceIds() {
  return Object.keys(gitOpsClaimDefinitions) as GitOpsResourceId[];
}

export class InfrastructureProvisioningService {
  private readonly octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({ auth: requireEnv("GITHUB_TOKEN") });
  }

  async provision(input: GitOpsProvisionRequestInput): Promise<GitOpsProvisionResult> {
    const definition = gitOpsClaimDefinitions[input.resourceId];

    if (!definition) {
      throw new InfrastructureProvisioningError("Unsupported infrastructure resource for GitOps claim generation.");
    }

    const claimName = slug(input.resourceName);
    const path = claimPath(input.environment, claimName);
    const manifest = buildClaimManifest(input, definition, claimName);
    const repository = await this.octokit.repos.get({
      owner: input.repositoryOwner,
      repo: input.repositoryName
    });
    const defaultBranch = repository.data.default_branch || defaultBranchFallback;
    const baseRef = await this.octokit.git.getRef({
      owner: input.repositoryOwner,
      repo: input.repositoryName,
      ref: `heads/${defaultBranch}`
    });
    const branch = `provision/${slug(input.serviceId || input.teamSlug || input.teamName)}/${input.environment}/${claimName}`;
    const db = requireDatabase();
    const existing = await db.infrastructureProvisionRequest.findFirst({
      where: {
        repositoryOwner: input.repositoryOwner,
        repositoryName: input.repositoryName,
        claimPath: path,
        mergeStatus: {
          not: "merged"
        }
      }
    });

    if (existing?.prUrl && existing.branch && existing.commitSha && existing.prNumber) {
      return {
        requestId: existing.id,
        resourceType: existing.resourceType,
        claimName: existing.claimName,
        claimKind: existing.claimKind,
        claimPath: existing.claimPath,
        branch: existing.branch,
        commitSha: existing.commitSha,
        prUrl: existing.prUrl,
        prNumber: existing.prNumber,
        status: existing.status,
        gitOpsStatus: existing.gitOpsStatus,
        provisioningStatus: existing.provisioningStatus,
        clusterStatus: existing.clusterStatus,
        manifest: existing.claimManifest
      };
    }

    const request = await db.infrastructureProvisionRequest.create({
      data: {
        resourceType: definition.displayName,
        resourceName: input.resourceName,
        claimName,
        claimKind: definition.kind,
        apiVersion,
        compositionRef: definition.compositionRef,
        teamName: input.teamName,
        teamSlug: slug(input.teamSlug || input.teamName),
        environment: input.environment,
        namespace: namespaceFor(input),
        serviceId: input.serviceId,
        serviceName: input.serviceName,
        requester: input.requester,
        requesterEmail: input.requesterEmail,
        status: "Requested",
        gitOpsStatus: "Branch pending",
        provisioningStatus: "Not started",
        clusterStatus: "Not observed",
        repositoryOwner: input.repositoryOwner,
        repositoryName: input.repositoryName,
        repositoryUrl: input.repositoryUrl || repositoryUrl(input.repositoryOwner, input.repositoryName),
        defaultBranch,
        claimPath: path,
        claimManifest: manifest,
        events: {
          create: [
            {
              event: "Resource Requested",
              actor: input.requester,
              status: "Requested",
              message: `${definition.displayName} claim requested for ${input.environment}.`
            },
            {
              event: "Claim Generated",
              actor: "Nexus Platform",
              status: "Generated",
              message: `${definition.kind} manifest generated at ${path}.`
            }
          ]
        }
      }
    });

    try {
      await this.ensureBranch(input.repositoryOwner, input.repositoryName, branch, baseRef.data.object.sha);
      const currentFile = await this.readOptionalFile(input.repositoryOwner, input.repositoryName, path, branch);
      const update = await this.octokit.repos.createOrUpdateFileContents({
        owner: input.repositoryOwner,
        repo: input.repositoryName,
        path,
        message: `feat: add ${claimName} infrastructure claim`,
        content: toBase64(manifest),
        sha: currentFile?.sha,
        branch
      });
      const commitSha = update.data.commit.sha || baseRef.data.object.sha;
      const pullRequest = await this.createOrGetPullRequest({
        owner: input.repositoryOwner,
        repo: input.repositoryName,
        base: defaultBranch,
        branch,
        title: `Provision ${definition.displayName} ${claimName}`,
        body: [
          `Adds a Crossplane ${definition.kind} claim for ${input.environment}.`,
          "",
          `Claim path: ${path}`,
          `Composition: ${definition.compositionRef}`,
          `Namespace: ${namespaceFor(input)}`,
          input.serviceName ? `Service: ${input.serviceName}` : `Team: ${input.teamName}`,
          "",
          "ArgoCD will apply this claim after approval and merge. Crossplane will provision through the existing platform-core XRDs and compositions."
        ].join("\n")
      });
      const updated = await db.infrastructureProvisionRequest.update({
        where: { id: request.id },
        data: {
          status: "PR Created",
          gitOpsStatus: "Awaiting Approval",
          provisioningStatus: "Waiting for merge",
          clusterStatus: "Not observed",
          branch,
          commitSha,
          prUrl: pullRequest.url,
          prNumber: pullRequest.number,
          prStatus: pullRequest.state,
          mergeStatus: "open",
          events: {
            create: [
              {
                event: "PR Created",
                actor: "Nexus Platform",
                status: pullRequest.existing ? "Open" : "Created",
                message: `GitOps PR ${pullRequest.existing ? "reused" : "created"}: ${pullRequest.url}`
              }
            ]
          }
        }
      });

      await db.auditLog.create({
        data: {
          action: "infrastructure.provision.requested",
          actor: input.requesterEmail || input.requester,
          targetType: "infrastructure",
          targetName: `${definition.kind}/${claimName}`,
          message: `Created GitOps claim PR ${pullRequest.url} for ${definition.displayName} ${claimName}.`
        }
      });

      return {
        requestId: updated.id,
        resourceType: updated.resourceType,
        claimName: updated.claimName,
        claimKind: updated.claimKind,
        claimPath: updated.claimPath,
        branch,
        commitSha,
        prUrl: pullRequest.url,
        prNumber: pullRequest.number,
        status: updated.status,
        gitOpsStatus: updated.gitOpsStatus,
        provisioningStatus: updated.provisioningStatus,
        clusterStatus: updated.clusterStatus,
        manifest
      };
    } catch (error) {
      const message = getGitHubErrorMessage(error);
      await db.infrastructureProvisionRequest.update({
        where: { id: request.id },
        data: {
          status: "Failed",
          gitOpsStatus: "PR creation failed",
          provisioningStatus: "Blocked",
          clusterStatus: "Not observed",
          errorMessage: message,
          events: {
            create: {
              event: "Provision Failed",
              actor: "Nexus Platform",
              status: "Failed",
              message
            }
          }
        }
      });

      throw new InfrastructureProvisioningError(message);
    }
  }

  async refreshPullRequest(input: { owner: string; repo: string; prNumber: number }) {
    const response = await this.octokit.pulls.get({
      owner: input.owner,
      repo: input.repo,
      pull_number: input.prNumber
    });

    return {
      state: response.data.state,
      merged: response.data.merged,
      url: response.data.html_url
    };
  }

  private async ensureBranch(owner: string, repo: string, branch: string, sha: string) {
    try {
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha
      });
    } catch (error) {
      if (getGitHubErrorStatus(error) !== 422) {
        throw error;
      }
    }
  }

  private async readOptionalFile(owner: string, repo: string, path: string, ref: string) {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref
      });

      if (Array.isArray(response.data) || response.data.type !== "file") {
        return null;
      }

      const file = response.data as RepositoryContentFile;

      return {
        sha: file.sha,
        content: file.content && file.encoding === "base64" ? fromBase64(file.content) : undefined
      };
    } catch (error) {
      if (getGitHubErrorStatus(error) === 404) {
        return null;
      }

      throw error;
    }
  }

  private async createOrGetPullRequest(input: {
    owner: string;
    repo: string;
    base: string;
    branch: string;
    title: string;
    body: string;
  }) {
    try {
      const response = await this.octokit.pulls.create({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        head: input.branch,
        base: input.base,
        body: input.body
      });

      return {
        number: response.data.number,
        url: response.data.html_url,
        state: response.data.state,
        existing: false
      };
    } catch (error) {
      if (getGitHubErrorStatus(error) !== 422) {
        throw error;
      }

      const openPullRequests = await this.octokit.pulls.list({
        owner: input.owner,
        repo: input.repo,
        state: "open",
        head: `${input.owner}:${input.branch}`,
        base: input.base
      });
      const existing = openPullRequests.data[0];

      if (!existing) {
        throw error;
      }

      return {
        number: existing.number,
        url: existing.html_url,
        state: existing.state,
        existing: true
      };
    }
  }
}

export async function listInfrastructureProvisionRequests() {
  const db = requireDatabase();
  const requests = await db.infrastructureProvisionRequest.findMany({
    include: {
      events: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  let service: InfrastructureProvisioningService | null = null;

  try {
    service = new InfrastructureProvisioningService();
  } catch {
    service = null;
  }

  if (!service) {
    return requests;
  }

  return Promise.all(requests.map(async (request) => {
    if (!request.prNumber) {
      return request;
    }

    try {
      const pullRequest = await service.refreshPullRequest({
        owner: request.repositoryOwner,
        repo: request.repositoryName,
        prNumber: request.prNumber
      });
      const merged = pullRequest.merged;

      if (merged && request.mergeStatus !== "merged") {
        return db.infrastructureProvisionRequest.update({
          where: { id: request.id },
          include: {
            events: {
              orderBy: {
                createdAt: "asc"
              }
            }
          },
          data: {
            status: "Merged",
            gitOpsStatus: "Merged",
            provisioningStatus: "ArgoCD Syncing",
            clusterStatus: "Not observed",
            prStatus: pullRequest.state,
            mergeStatus: "merged",
            events: {
              create: [
                {
                  event: "PR Merged",
                  actor: "GitHub",
                  status: "Merged",
                  message: `GitOps PR merged: ${pullRequest.url}`
                },
                {
                  event: "ArgoCD Sync Started",
                  actor: "ArgoCD",
                  status: "Syncing",
                  message: "Merge detected; ArgoCD should sync the claim through the service overlay."
                }
              ]
            }
          }
        });
      }

      return {
        ...request,
        prStatus: pullRequest.state,
        mergeStatus: merged ? "merged" : request.mergeStatus
      };
    } catch {
      return request;
    }
  }));
}

export function createInfrastructureProvisioningService() {
  return new InfrastructureProvisioningService();
}
