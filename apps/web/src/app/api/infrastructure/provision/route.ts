import { NextResponse } from "next/server";

import {
  InfrastructureProvisioningConfigurationError,
  InfrastructureProvisioningError,
  createInfrastructureProvisioningService,
  isGitOpsResourceId,
  type GitOpsProvisionEnvironment,
  type GitOpsProvisionRequestInput
} from "@/lib/server/infrastructure-provisioning";
import { getPersistedService } from "@/lib/server/catalog";

type ProvisionApiRequest = {
  resourceId?: unknown;
  resourceName?: unknown;
  teamName?: unknown;
  teamSlug?: unknown;
  environment?: unknown;
  costCenter?: unknown;
  serviceId?: unknown;
  serviceName?: unknown;
  repositoryOwner?: unknown;
  repositoryName?: unknown;
  repositoryUrl?: unknown;
  requester?: unknown;
  requesterEmail?: unknown;
  parameters?: unknown;
};

const environments = new Set(["dev", "stage", "prod"]);

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(message: string, status: number, details?: string[]) {
  return NextResponse.json(
    {
      error: message,
      details
    },
    { status }
  );
}

function parameterValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
      .map(([key, item]) => [key, item as string | number | boolean])
  );
}

function configuredGitHubOwner() {
  return process.env.GITHUB_ORG?.trim() || process.env.GITHUB_OWNER?.trim() || "";
}

function isPlaceholderOwner(value: string) {
  return ["acme", "acme-platform", "demo-org", "github-owner-not-configured"].includes(value.trim().toLowerCase());
}

function repositoryUrl(owner: string, name: string) {
  return `https://github.com/${owner}/${name}`;
}

function parseRepositoryUrl(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\.git$/, "");
  const [owner, name] = normalized.split("/");

  if (!owner || !name) {
    return null;
  }

  return { owner, name };
}

async function resolveRepository(body: ProvisionApiRequest) {
  const requestedOwner = stringValue(body.repositoryOwner);
  const requestedName = stringValue(body.repositoryName);
  const requestedUrl = stringValue(body.repositoryUrl);
  const serviceId = stringValue(body.serviceId);
  const configuredOwner = configuredGitHubOwner();
  const urlRepository = parseRepositoryUrl(requestedUrl);

  if (serviceId) {
    try {
      const service = await getPersistedService(serviceId);

      if (service?.repositoryOwner && service.repositoryName) {
        const shouldUsePersistedRepository = !requestedOwner || isPlaceholderOwner(requestedOwner) || !requestedName;

        if (shouldUsePersistedRepository) {
          return {
            owner: service.repositoryOwner,
            name: service.repositoryName,
            url: service.repositoryUrl || repositoryUrl(service.repositoryOwner, service.repositoryName)
          };
        }
      }
    } catch {
      // Database-backed catalog lookup is best-effort; configured owner normalization below still prevents demo owners.
    }
  }

  const ownerCandidate = requestedOwner || urlRepository?.owner || "";
  const name = requestedName || urlRepository?.name || "";
  const owner = ownerCandidate && !isPlaceholderOwner(ownerCandidate) ? ownerCandidate : configuredOwner;

  return {
    owner,
    name,
    url: owner && name ? repositoryUrl(owner, name) : requestedUrl
  };
}

async function validateBody(body: ProvisionApiRequest) {
  const resourceId = stringValue(body.resourceId);
  const resourceName = stringValue(body.resourceName);
  const teamName = stringValue(body.teamName);
  const teamSlug = stringValue(body.teamSlug) || teamName;
  const environment = stringValue(body.environment);
  const repository = await resolveRepository(body);
  const requester = stringValue(body.requester) || "IDP user";
  const requesterEmail = stringValue(body.requesterEmail) || requester;
  const errors: string[] = [];

  if (!isGitOpsResourceId(resourceId)) {
    errors.push("Resource must be one of PostgreSQL, Redis, S3 Bucket, SQS Queue, or DynamoDB Table.");
  }

  if (!resourceName) {
    errors.push("Resource name is required.");
  }

  if (!teamName) {
    errors.push("Team is required.");
  }

  if (!environments.has(environment)) {
    errors.push("Environment must be dev, stage, or prod.");
  }

  if (!repository.owner || !repository.name) {
    errors.push("A GitOps repository owner and name are required.");
  }

  return {
    data: {
      resourceId,
      resourceName,
      teamName,
      teamSlug,
      environment: environment as GitOpsProvisionEnvironment,
      costCenter: stringValue(body.costCenter),
      serviceId: stringValue(body.serviceId) || undefined,
      serviceName: stringValue(body.serviceName) || undefined,
      repositoryOwner: repository.owner,
      repositoryName: repository.name,
      repositoryUrl: repository.url || undefined,
      requester,
      requesterEmail,
      parameters: parameterValues(body.parameters)
    } as GitOpsProvisionRequestInput,
    errors
  };
}

export async function POST(request: Request) {
  let body: ProvisionApiRequest;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const validation = await validateBody(body);

  if (validation.errors.length > 0) {
    return jsonError("Invalid infrastructure provision request.", 400, validation.errors);
  }

  try {
    const service = createInfrastructureProvisioningService();
    const result = await service.provision(validation.data);

    return NextResponse.json({
      mode: "gitops",
      provisionRequest: result
    });
  } catch (error) {
    if (error instanceof InfrastructureProvisioningConfigurationError) {
      return NextResponse.json(
        {
          mode: "blocked",
          error: error.message
        },
        { status: 503 }
      );
    }

    if (error instanceof InfrastructureProvisioningError) {
      return NextResponse.json(
        {
          mode: "warning",
          error: error.message
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown infrastructure provisioning failure.";

    return NextResponse.json(
      {
        mode: "warning",
        error: message
      },
      { status: 502 }
    );
  }
}
