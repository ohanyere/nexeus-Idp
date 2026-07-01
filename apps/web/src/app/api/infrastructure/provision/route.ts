import { NextResponse } from "next/server";

import {
  InfrastructureProvisioningConfigurationError,
  InfrastructureProvisioningError,
  createInfrastructureProvisioningService,
  isGitOpsResourceId,
  type GitOpsProvisionEnvironment,
  type GitOpsProvisionRequestInput
} from "@/lib/server/infrastructure-provisioning";

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

function validateBody(body: ProvisionApiRequest) {
  const resourceId = stringValue(body.resourceId);
  const resourceName = stringValue(body.resourceName);
  const teamName = stringValue(body.teamName);
  const teamSlug = stringValue(body.teamSlug) || teamName;
  const environment = stringValue(body.environment);
  const repositoryOwner = stringValue(body.repositoryOwner);
  const repositoryName = stringValue(body.repositoryName);
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

  if (!repositoryOwner || !repositoryName) {
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
      repositoryOwner,
      repositoryName,
      repositoryUrl: stringValue(body.repositoryUrl) || undefined,
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

  const validation = validateBody(body);

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
