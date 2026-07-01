import { ProvisionRequestsView } from "@/components/InfrastructureViews";
import type { GitOpsProvisionRequestView } from "@/components/InfrastructureViews";
import { PageHeader } from "@/components/PageHeader";
import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";
import { listInfrastructureProvisionRequests } from "@/lib/server/infrastructure-provisioning";

export const dynamic = "force-dynamic";

export default async function ProvisionRequestsPage() {
  const { requests, warning } = await loadRequests();

  return (
    <>
      <PageHeader title="Provision Requests" description="GitOps workflow from developer request to claim PR, approval, ArgoCD sync, Crossplane reconciliation, and readiness." action={<ProvisionResourceButton label="New Request" />} />
      <ProvisionRequestsView requests={requests} warning={warning} />
    </>
  );
}

async function loadRequests() {
  try {
    const requests = await listInfrastructureProvisionRequests();

    return {
      requests: requests.map(toView),
      warning: undefined
    };
  } catch (error) {
    return {
      requests: [],
      warning: error instanceof Error ? `Provision requests unavailable: ${error.message}` : "Provision requests unavailable."
    };
  }
}

function toView(request: Awaited<ReturnType<typeof listInfrastructureProvisionRequests>>[number]): GitOpsProvisionRequestView {
  return {
    id: request.id,
    requester: request.requester,
    resourceType: request.resourceType,
    resourceName: request.resourceName,
    teamName: request.teamName,
    environment: request.environment,
    status: request.status,
    gitOpsStatus: request.gitOpsStatus,
    provisioningStatus: request.provisioningStatus,
    clusterStatus: request.clusterStatus,
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
