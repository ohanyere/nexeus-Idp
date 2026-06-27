import "server-only";

import { Octokit } from "@octokit/rest";

import { requireDatabase } from "@/lib/server/prisma";

export type PromotionTargetEnvironment = "stage" | "prod";
export type PromotionSourceEnvironment = "dev" | "stage";
export type PromotionStatus = "pr_created" | "pr_open" | "unchanged" | "warning";

export type PromotionRequest = {
 service: string;
 owner: string;
 repo: string;
 targetEnvironment: PromotionTargetEnvironment;
 actor: string;
};

export type EnvironmentReleaseState = {
 environment: "dev" | "stage" | "prod";
 sha: string;
 overlayPath: string;
 status: "deployed" | "unknown";
};

export type PromotionAuditEvent = {
 action: string;
 actor: string;
 service: string;
 environment: PromotionTargetEnvironment;
 sha: string;
 time: string;
 prUrl?: string;
 status: PromotionStatus | "failed";
 message: string;
};

export type PromotionResult = {
 service: string;
 sourceEnvironment: PromotionSourceEnvironment;
 targetEnvironment: PromotionTargetEnvironment;
 sha: string;
 branch: string;
 commitSha?: string;
 prUrl?: string;
 prNumber?: number;
 status: PromotionStatus;
 auditEvent: PromotionAuditEvent;
 warning?: string;
};

export type ReleaseSnapshot = {
 service: string;
 owner: string;
 repo: string;
 defaultBranch: string;
 environments: EnvironmentReleaseState[];
 openPullRequests: Array<{
  number: number;
  title: string;
  url: string;
  head: string;
  base: string;
  state: string;
 }>;
};

type RepositoryContentFile = {
 type: "file";
 content?: string;
 encoding?: string;
 sha?: string;
};

type OverlayReadResult = {
 path: string;
 content: string;
 sha?: string;
 imageSha: string;
};

const overlayPaths = {
 dev: "k8s/overlays/dev/kustomization.yaml",
 stage: "k8s/overlays/stage/kustomization.yaml",
 prod: "k8s/overlays/prod/kustomization.yaml"
} as const;

class PromotionConfigurationError extends Error {
 constructor(message: string) {
 super(message);
 this.name = "PromotionConfigurationError";
 }
}

export class PromotionServiceError extends Error {
 constructor(message: string, public readonly auditEvent?: PromotionAuditEvent) {
 super(message);
 this.name = "PromotionServiceError";
 }
}

function requireEnv(name: string) {
 const value = process.env[name]?.trim();

 if (!value) {
 throw new PromotionConfigurationError(`Missing required environment variable: ${name}.`);
 }

 return value;
}

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "Unknown GitHub API error.";
}

function getGitHubErrorStatus(error: unknown) {
 if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
 return error.status;
 }

 return undefined;
}

function branchSegment(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function sourceEnvironmentFor(targetEnvironment: PromotionTargetEnvironment): PromotionSourceEnvironment {
 return targetEnvironment === "stage" ? "dev" : "stage";
}

function extractKustomizeNewTag(content: string) {
 const match = content.match(/^\s*newTag\s*:\s*["']?([^"'\s#]+)["']?.*$/m);

 if (!match?.[1]) {
 throw new PromotionServiceError("Could not find a Kustomize images.newTag value in the overlay.");
 }

 return match[1];
}

function replaceOnlyKustomizeNewTag(content: string, newTag: string) {
 let replaced = false;
 const nextContent = content.replace(
 /^(\s*newTag\s*:\s*)(["']?)([^"'\n#]+)(["']?)(\s*(?:#.*)?)$/m,
 (line, prefix: string, quote: string, _current: string, closingQuote: string, suffix: string) => {
  if (replaced) {
   return line as string;
  }

  replaced = true;
  const normalizedClosingQuote = quote ? closingQuote || quote : "";
  return `${prefix}${quote}${newTag}${normalizedClosingQuote}${suffix}`;
 }
 );

 if (!replaced) {
  throw new PromotionServiceError("Could not update the target overlay because no newTag line was found.");
 }

 return nextContent;
}

function toBase64(content: string) {
 return Buffer.from(content, "utf8").toString("base64");
}

function fromBase64(content: string) {
 return Buffer.from(content, "base64").toString("utf8");
}

function buildAuditEvent(input: {
 actor: string;
 service: string;
 environment: PromotionTargetEnvironment;
 sha: string;
 status: PromotionAuditEvent["status"];
 prUrl?: string;
 message: string;
}): PromotionAuditEvent {
 return {
  action: "promotion.requested",
  actor: input.actor,
  service: input.service,
  environment: input.environment,
  sha: input.sha,
  time: new Date().toISOString(),
  prUrl: input.prUrl,
  status: input.status,
  message: input.message
 };
}

export class PromotionService {
 private readonly octokit: Octokit;

 constructor() {
 this.octokit = new Octokit({ auth: requireEnv("GITHUB_TOKEN") });
 }

 async getReleaseSnapshot(input: { service: string; owner: string; repo: string }): Promise<ReleaseSnapshot> {
 const repository = await this.octokit.repos.get({
  owner: input.owner,
  repo: input.repo
 });
 const defaultBranch = repository.data.default_branch || "main";
 const environments: EnvironmentReleaseState[] = [];

 for (const environment of ["dev", "stage", "prod"] as const) {
  try {
   const overlay = await this.readOverlay(input.owner, input.repo, overlayPaths[environment], defaultBranch);
   environments.push({
    environment,
    sha: overlay.imageSha,
    overlayPath: overlay.path,
    status: "deployed"
   });
  } catch {
   environments.push({
    environment,
    sha: "unknown",
    overlayPath: overlayPaths[environment],
    status: "unknown"
   });
  }
 }

 const pullRequests = await this.octokit.pulls.list({
  owner: input.owner,
  repo: input.repo,
  state: "open",
  base: defaultBranch,
  per_page: 20
 });

 return {
  service: input.service,
  owner: input.owner,
  repo: input.repo,
  defaultBranch,
  environments,
  openPullRequests: pullRequests.data
  .filter((pullRequest) => pullRequest.head.ref.startsWith(`promote/${branchSegment(input.service)}/`))
  .map((pullRequest) => ({
   number: pullRequest.number,
   title: pullRequest.title,
   url: pullRequest.html_url,
   head: pullRequest.head.ref,
   base: pullRequest.base.ref,
   state: pullRequest.state
  }))
 };
 }

 async promote(input: PromotionRequest): Promise<PromotionResult> {
 const sourceEnvironment = sourceEnvironmentFor(input.targetEnvironment);
 const repository = await this.octokit.repos.get({
  owner: input.owner,
  repo: input.repo
 });
 const defaultBranch = repository.data.default_branch || "main";
 const baseRef = await this.octokit.git.getRef({
  owner: input.owner,
  repo: input.repo,
  ref: `heads/${defaultBranch}`
 });
 const sourceOverlay = await this.readOverlay(input.owner, input.repo, overlayPaths[sourceEnvironment], defaultBranch);
 const imageSha = sourceOverlay.imageSha;
 const branch = `promote/${branchSegment(input.service)}/${input.targetEnvironment}/${branchSegment(imageSha)}`;
 const auditBase = {
  actor: input.actor,
  service: input.service,
  environment: input.targetEnvironment,
  sha: imageSha
 };

 try {
  await this.ensureBranch(input.owner, input.repo, branch, baseRef.data.object.sha);

  const targetOverlay = await this.readOverlay(input.owner, input.repo, overlayPaths[input.targetEnvironment], branch);
  const nextContent = replaceOnlyKustomizeNewTag(targetOverlay.content, imageSha);

  if (nextContent === targetOverlay.content) {
   const auditEvent = buildAuditEvent({
    ...auditBase,
    status: "unchanged",
    message: `${input.service} ${input.targetEnvironment} already references ${imageSha}.`
   });
   await this.writeAuditEvent(auditEvent);

   return {
    service: input.service,
    sourceEnvironment,
    targetEnvironment: input.targetEnvironment,
    sha: imageSha,
    branch,
    status: "unchanged",
    auditEvent
   };
  }

  const update = await this.octokit.repos.createOrUpdateFileContents({
   owner: input.owner,
   repo: input.repo,
   path: overlayPaths[input.targetEnvironment],
   message: `chore: promote ${input.service} to ${input.targetEnvironment}`,
   content: toBase64(nextContent),
   sha: targetOverlay.sha,
   branch
  });
  const commitSha = update.data.commit.sha;
  const pullRequest = await this.createOrGetPromotionPullRequest({
   owner: input.owner,
   repo: input.repo,
   base: defaultBranch,
   branch,
   service: input.service,
   sourceEnvironment,
   targetEnvironment: input.targetEnvironment,
   imageSha
  });
  const auditEvent = buildAuditEvent({
   ...auditBase,
   status: pullRequest.existing ? "pr_open" : "pr_created",
   prUrl: pullRequest.url,
   message: `${input.service} ${sourceEnvironment} to ${input.targetEnvironment} promotion PR ${pullRequest.existing ? "is open" : "created"} for ${imageSha}.`
  });
  await this.writeAuditEvent(auditEvent);

  return {
   service: input.service,
   sourceEnvironment,
   targetEnvironment: input.targetEnvironment,
   sha: imageSha,
   branch,
   commitSha,
   prUrl: pullRequest.url,
   prNumber: pullRequest.number,
   status: pullRequest.existing ? "pr_open" : "pr_created",
   auditEvent
  };
 } catch (error) {
  const auditEvent = buildAuditEvent({
   ...auditBase,
   status: "failed",
   message: `Promotion PR creation failed: ${getErrorMessage(error)}`
  });
  await this.writeAuditEvent(auditEvent);
  throw new PromotionServiceError(auditEvent.message, auditEvent);
 }
 }

 private async readOverlay(owner: string, repo: string, path: string, ref: string): Promise<OverlayReadResult> {
 const response = await this.octokit.repos.getContent({
  owner,
  repo,
  path,
  ref
 });

 if (Array.isArray(response.data) || response.data.type !== "file") {
  throw new PromotionServiceError(`Expected ${path} in ${owner}/${repo} to be a file.`);
 }

 const file = response.data as RepositoryContentFile;

 if (!file.content || file.encoding !== "base64") {
  throw new PromotionServiceError(`Could not read ${path} as base64 content.`);
 }

 const content = fromBase64(file.content);

 return {
  path,
  content,
  sha: file.sha,
  imageSha: extractKustomizeNewTag(content)
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

 private async createOrGetPromotionPullRequest(input: {
 owner: string;
 repo: string;
 base: string;
 branch: string;
 service: string;
 sourceEnvironment: PromotionSourceEnvironment;
 targetEnvironment: PromotionTargetEnvironment;
 imageSha: string;
 }) {
 try {
  const response = await this.octokit.pulls.create({
   owner: input.owner,
   repo: input.repo,
   title: `Promote ${input.service} to ${input.targetEnvironment}`,
   head: input.branch,
   base: input.base,
   body: [
    `Promotes ${input.service} from ${input.sourceEnvironment} to ${input.targetEnvironment}.`,
    "",
    `Image SHA: ${input.imageSha}`,
    `Overlay: ${overlayPaths[input.targetEnvironment]}`,
    "",
    "This PR is approval-gated and must be merged manually."
   ].join("\n")
  });

  return {
   number: response.data.number,
   url: response.data.html_url,
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
   existing: true
  };
 }
 }

 private async writeAuditEvent(event: PromotionAuditEvent) {
 try {
  const db = requireDatabase();
  const service = await db.service.findFirst({
   where: {
    OR: [
     { name: event.service },
     { repositoryName: event.service }
    ]
   },
   select: {
    id: true,
    teamId: true
   }
  });

  await db.auditLog.create({
   data: {
    action: event.action,
    actor: event.actor,
    targetType: "promotion",
    targetName: `${event.service}:${event.environment}:${event.sha}`,
    message: `${event.message}${event.prUrl ? ` PR: ${event.prUrl}` : ""}`,
    serviceId: service?.id,
    teamId: service?.teamId
   }
  });
 } catch {
  if (process.env.NODE_ENV === "development") {
   console.info("[promotion:audit]", event);
  }
 }
 }
}

export function createPromotionService() {
 return new PromotionService();
}
