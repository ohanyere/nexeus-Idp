import { ProvisionRequestsView } from "@/components/InfrastructureViews";
import type { GitOpsProvisionRequestView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";
import { listInfrastructureProvisionRequests } from "@/lib/server/infrastructure-provisioning";
import { getProvisionRuntimeOverlay } from "@/lib/server/runtime-status";
import type { EnvironmentName } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function ProvisionRequestsPage() {
  const { requests, warning } = await loadRequests();
  const configuredRepositoryOwner = process.env.GITHUB_ORG?.trim() || process.env.GITHUB_OWNER?.trim();

  return (
    <>
      <PageHeader title="Provision Requests" description="GitOps workflow from developer request to claim PR, approval, ArgoCD sync, Crossplane reconciliation, and readiness." action={<ProvisionResourceButton configuredRepositoryOwner={configuredRepositoryOwner} label="New Request" />} />
      <ProvisionRequestsView requests={requests} warning={warning} />
    </>
  );
}

async function loadRequests() {
  try {
    const requests = await listInfrastructureProvisionRequests();
    const views = await Promise.all(requests.map(toView));

    return {
      requests: views,
      warning: undefined
    };
  } catch (error) {
    return {
      requests: [],
      warning: error instanceof Error ? `Provision requests unavailable: ${error.message}` : "Provision requests unavailable."
    };
  }
}

async function toView(request: Awaited<ReturnType<typeof listInfrastructureProvisionRequests>>[number]): Promise<GitOpsProvisionRequestView> {
  const overlay = await getProvisionRuntimeOverlay({
    repositoryName: request.repositoryName,
    environment: isEnvironmentName(request.environment) ? request.environment : "dev",
    namespace: request.namespace,
    claimKind: request.claimKind,
    claimName: request.claimName,
    prNumber: request.prNumber,
    gitOpsStatus: request.gitOpsStatus,
    provisioningStatus: request.provisioningStatus,
    clusterStatus: request.clusterStatus
  });

  return {
    id: request.id,
    requester: request.requester,
    resourceType: request.resourceType,
    resourceName: request.resourceName,
    teamName: request.teamName,
    environment: request.environment,
    status: request.status,
    gitOpsStatus: overlay.gitOpsStatus ?? request.gitOpsStatus,
    provisioningStatus: overlay.provisioningStatus ?? request.provisioningStatus,
    clusterStatus: overlay.clusterStatus ?? request.clusterStatus,
    gitOpsSource: overlay.gitOpsSource,
    provisioningSource: overlay.provisioningSource,
    clusterSource: overlay.clusterSource,
    branch: request.branch,
    commitSha: request.commitSha,
    prUrl: request.prUrl,
    prNumber: request.prNumber,
    prStatus: request.prStatus,
    mergeStatus: request.mergeStatus,
    claimPath: request.claimPath,
    repositoryOwner: request.repositoryOwner,
    repositoryName: request.repositoryName,
    serviceName: request.serviceName,
    errorMessage: request.errorMessage,
    runtimeWarnings: overlay.warnings,
    createdAt: request.createdAt.toISOString(),
    events: request.events.map((event) => ({
      event: event.event,
      actor: event.actor,
      status: event.status,
      message: event.message,
      createdAt: event.createdAt.toISOString()
    }))
  };
}

function isEnvironmentName(value: string): value is EnvironmentName {
  return ["dev", "stage", "prod"].includes(value);
}
