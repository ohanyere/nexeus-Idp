import { DataTable } from "@/components/DataTable";
import { DeploymentPromotionActions } from "@/components/DeploymentPromotionActions";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { listPersistedServices } from "@/lib/server/catalog";
import {
 createPromotionService,
 type EnvironmentReleaseState,
 type ReleaseSnapshot
} from "@/lib/server/promotion-service";
import { environmentPromotions, getServiceById } from "@/lib/mock-data";
import type { StatusTone } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ReleaseEnvironmentName = "dev" | "stage" | "prod";

type RealDeploymentRelease = {
 serviceId: string;
 serviceName: string;
 teamName: string;
 repositoryOwner: string;
 repositoryName: string;
 repositoryUrl: string;
 defaultBranch: string;
 environments: Array<EnvironmentReleaseState & { tone: StatusTone }>;
 openPullRequests: ReleaseSnapshot["openPullRequests"];
 warning?: string;
};

const releaseEnvironmentNames: ReleaseEnvironmentName[] = ["dev", "stage", "prod"];

function fallbackEnvironment(environment: ReleaseEnvironmentName): EnvironmentReleaseState & { tone: StatusTone } {
 return {
 environment,
 sha: "unknown",
 overlayPath: `k8s/overlays/${environment}/kustomization.yaml`,
 status: "unknown",
 tone: "warning"
 };
}

function releaseEnvironment(snapshot: ReleaseSnapshot | null, environment: ReleaseEnvironmentName) {
 const fromSnapshot = snapshot?.environments.find((candidate) => candidate.environment === environment);

 if (!fromSnapshot) {
 return fallbackEnvironment(environment);
 }

 return {
 ...fromSnapshot,
 tone: statusTone(fromSnapshot.status)
 };
}

function getEnvironment(release: RealDeploymentRelease, environment: ReleaseEnvironmentName) {
 return release.environments.find((candidate) => candidate.environment === environment) ?? fallbackEnvironment(environment);
}

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "Unable to load release state.";
}

async function loadRealDeploymentReleases() {
 try {
 const services = await listPersistedServices();

 if (services.length === 0) {
  return {
   releases: [] as RealDeploymentRelease[],
   warning: undefined
  };
 }

 let promotionService: ReturnType<typeof createPromotionService> | null = null;
 let serviceWarning: string | undefined;

 try {
  promotionService = createPromotionService();
 } catch (error) {
  serviceWarning = getErrorMessage(error);
 }

 const releases = await Promise.all(services.map(async (service) => {
  let snapshot: ReleaseSnapshot | null = null;
  let warning = serviceWarning;

  if (promotionService) {
   try {
    snapshot = await promotionService.getReleaseSnapshot({
     service: service.name,
     owner: service.repositoryOwner,
     repo: service.repositoryName
    });
   } catch (error) {
    warning = getErrorMessage(error);
   }
  }

  return {
   serviceId: service.name,
   serviceName: service.name,
   teamName: service.team.name,
   repositoryOwner: service.repositoryOwner,
   repositoryName: service.repositoryName,
   repositoryUrl: service.repositoryUrl,
   defaultBranch: snapshot?.defaultBranch ?? service.defaultBranch,
   environments: releaseEnvironmentNames.map((environment) => releaseEnvironment(snapshot, environment)),
   openPullRequests: snapshot?.openPullRequests ?? [],
   warning
  };
 }));

 return {
  releases,
  warning: undefined
 };
 } catch (error) {
 return {
  releases: [] as RealDeploymentRelease[],
  warning: getErrorMessage(error)
 };
 }
}

function MockDeploymentsPage({ warning }: { warning?: string }) {
 const openPromotionPullRequests = environmentPromotions.flatMap((promotion) =>
 promotion.history.filter((event) => event.mergeStatus === "open" && event.prUrl)
 );
 const pendingApprovals = environmentPromotions.flatMap((promotion) =>
 promotion.history.filter((event) => event.approvalStatus === "pending")
 );
 const productionDeployments = environmentPromotions.filter((promotion) =>
 promotion.environments.some((environment) => environment.environment === "prod" && environment.deployed)
 );
 const rejectedPromotions = environmentPromotions.flatMap((promotion) =>
 promotion.history.filter((event) => event.approvalStatus === "rejected")
 );

 const rows = environmentPromotions.map((promotion) => {
 const service = getServiceById(promotion.serviceId);
 const dev = promotion.environments.find((environment) => environment.environment === "dev");
 const stage = promotion.environments.find((environment) => environment.environment === "stage");
 const prod = promotion.environments.find((environment) => environment.environment === "prod");
 const latestHistory = promotion.history[0];

 return {
 service: (
 <Link href={`/services/${promotion.serviceId}`} className="font-semibold text-brand hover:text-slate-900">
 {service?.name ?? promotion.serviceId}
 </Link>
 ),
 repository: `${promotion.repositoryOwner}/${promotion.repositoryName}`,
 "current dev sha": dev?.sha ?? "unknown",
 "current stage sha": stage?.sha ?? "unknown",
 "current production sha": prod?.sha ?? "unknown",
 "approval status": latestHistory ? <StatusBadge label={latestHistory.approvalStatus} tone={latestHistory.approvalStatus === "rejected" ? "danger" : latestHistory.approvalStatus === "pending" ? "warning" : "success"} /> : "none",
 merged: latestHistory ? <StatusBadge label={latestHistory.mergeStatus} tone={latestHistory.mergeStatus === "merged" ? "success" : latestHistory.mergeStatus === "open" ? "warning" : latestHistory.mergeStatus === "rejected" ? "danger" : "neutral"} /> : "none",
 deployed: latestHistory ? <StatusBadge label={latestHistory.deployed ? "deployed" : "pending"} tone={latestHistory.deployed ? "success" : "warning"} /> : "none",
 "open pr": latestHistory?.prUrl ? (
 <a href={latestHistory.prUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-slate-900">
 View PR
 </a>
 ) : "none",
 "release workflow": (
 <Link href={`/services/${promotion.serviceId}`} className="font-semibold text-brand hover:text-slate-900">
 Promote
 </Link>
 )
 };
 });

 const timelineRows = environmentPromotions.flatMap((promotion) =>
 promotion.timeline.map((event) => ({
  service: getServiceById(promotion.serviceId)?.name ?? promotion.serviceId,
  event: event.event,
  environment: event.environment,
  time: event.time,
  status: <StatusBadge label={event.status} tone={event.tone} />
 }))
 );

 return (
 <>
 <PageHeader
 title="GitOps release management"
 description="Manage dev-to-stage and stage-to-production promotion through approval-gated GitHub pull requests."
 />
 {warning && process.env.NODE_ENV === "development" ? (
 <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
 Showing development demo data because persisted catalog services could not be loaded: {warning}
 </section>
 ) : null}
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
 <StatCard label="Managed services" value={String(environmentPromotions.length)} detail="GitOps release records" />
 <StatCard label="Open PRs" value={String(openPromotionPullRequests.length)} detail="Awaiting review or merge" tone="warning" />
 <StatCard label="Pending approvals" value={String(pendingApprovals.length)} detail="Lead or production approval" tone="warning" />
 <StatCard label="Production deployed" value={String(productionDeployments.length)} detail="Prod overlay merged and synced" tone="success" />
 <StatCard label="Rejected" value={String(rejectedPromotions.length)} detail="Promotion blocked by review or policy" tone="danger" />
 </section>
 <DataTable
 columns={[
 "service",
 "repository",
 "current dev sha",
 "current stage sha",
 "current production sha",
 "approval status",
 "merged",
 "deployed",
 "open pr",
 "release workflow"
 ]}
 rows={rows}
 />
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Release timeline</h2>
 <DataTable columns={["service", "event", "environment", "time", "status"]} rows={timelineRows} />
 </article>
 </>
 );
}

export default async function DeploymentsPage() {
 const { releases, warning } = await loadRealDeploymentReleases();

 if (releases.length === 0) {
 return <MockDeploymentsPage warning={warning} />;
 }

 const openPromotionPullRequests = releases.flatMap((release) => release.openPullRequests);
 const productionDeployments = releases.filter((release) => getEnvironment(release, "prod").status === "deployed");
 const releaseWarnings = releases.filter((release) => release.warning || release.environments.some((environment) => environment.status === "unknown"));
 const rows = releases.map((release) => {
 const dev = getEnvironment(release, "dev");
 const stage = getEnvironment(release, "stage");
 const prod = getEnvironment(release, "prod");
 const openPullRequest = release.openPullRequests[0];

 return {
  service: (
  <Link href={`/services/${release.serviceId}`} className="font-semibold text-brand hover:text-slate-900">
  {release.serviceName}
  </Link>
  ),
  team: release.teamName,
  repository: (
  <a href={release.repositoryUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-slate-900">
  {release.repositoryOwner}/{release.repositoryName}
  </a>
  ),
  "current dev sha": <ReleaseSha environment={dev} />,
  "current stage sha": <ReleaseSha environment={stage} />,
  "current production sha": <ReleaseSha environment={prod} />,
  "open pr": openPullRequest ? (
  <a href={openPullRequest.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-slate-900">
  PR #{openPullRequest.number}
  </a>
  ) : "none",
  actions: (
  <DeploymentPromotionActions
  service={release.serviceName}
  owner={release.repositoryOwner}
  repo={release.repositoryName}
  />
  )
 };
 });

 const releaseStateRows = releases.flatMap((release) =>
 release.environments.map((environment) => ({
  service: release.serviceName,
  environment: environment.environment,
  overlay: environment.overlayPath,
  "image sha": environment.sha,
  status: <StatusBadge label={environment.status} tone={environment.tone} />,
  warning: release.warning ?? "none"
 }))
 );

 return (
 <>
 <PageHeader
 title="GitOps release management"
 description="Manage dev-to-stage and stage-to-production promotion through approval-gated GitHub pull requests."
 />
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
 <StatCard label="Managed services" value={String(releases.length)} detail="Persisted catalog records" />
 <StatCard label="Open PRs" value={String(openPromotionPullRequests.length)} detail="Awaiting review or merge" tone={openPromotionPullRequests.length > 0 ? "warning" : "neutral"} />
 <StatCard label="Promotion actions" value={String(releases.length * 2)} detail="Dev to stage and stage to prod" tone="info" />
 <StatCard label="Production deployed" value={String(productionDeployments.length)} detail="Prod overlay readable" tone="success" />
 <StatCard label="Warnings" value={String(releaseWarnings.length)} detail="Missing release state or API warning" tone={releaseWarnings.length > 0 ? "warning" : "neutral"} />
 </section>
 <DataTable
 columns={[
 "service",
 "team",
 "repository",
 "current dev sha",
 "current stage sha",
 "current production sha",
 "open pr",
 "actions"
 ]}
 rows={rows}
 />
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Release state</h2>
 <DataTable columns={["service", "environment", "overlay", "image sha", "status", "warning"]} rows={releaseStateRows} />
 </article>
 </>
 );
}

function ReleaseSha({ environment }: { environment: EnvironmentReleaseState & { tone: StatusTone } }) {
 return (
 <div className="grid gap-1">
 <span className="break-all font-mono text-xs text-slate-800">{environment.sha}</span>
 <StatusBadge label={environment.status} tone={environment.tone} />
 </div>
 );
}
