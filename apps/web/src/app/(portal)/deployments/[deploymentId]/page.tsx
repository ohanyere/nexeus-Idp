import { RollbackButton } from "@/components/DeploymentActions";
import { PageHeader } from "@/components/PageHeader";
import { ReleaseTimelinePanel } from "@/components/ReleaseTimelinePanel";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { deployments, getServiceById } from "@/lib/mock-data";
import type { EnvironmentName } from "@/lib/mock-data";
import type { ReleaseTimelineEvent } from "@/lib/release-timeline";
import { getRuntimeStatus, type RuntimeStatusSnapshot } from "@/lib/server/runtime-status";
import { statusTone } from "@/lib/status";
import { notFound } from "next/navigation";

type DeploymentDetailPageProps = {
 params: Promise<{
 deploymentId: string;
 }>;
};

export const dynamic = "force-dynamic";

export default async function DeploymentDetailPage({ params }: DeploymentDetailPageProps) {
 const { deploymentId } = await params;
 const deployment = deployments.find((item) => item.id === deploymentId);

 if (!deployment) {
 notFound();
 }

 const service = getServiceById(deployment.serviceId);
 const runtime = await getRuntimeStatus({
 serviceId: deployment.serviceId,
 serviceName: deployment.service,
 repositoryUrl: service?.documentation.repository,
 dockerImage: deployment.image,
 environments: service?.environments ?? [deployment.environment]
 });
 const releaseEvents = runtimeTimelineEvents(runtime, deployment.environment);

 return (
 <>
 <PageHeader
 eyebrow="Deployment detail"
 title={`${deployment.service} ${deployment.version}`}
 description="Deployment catalog detail with runtime release status read from configured integrations."
 action={<RollbackButton deployment={deployment} />}
 />

 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <StatCard label="Environment" value={deployment.environment} detail="Deployment target" />
 <StatCard label="Status" value={deployment.status} detail="Deployment record" tone={deployment.tone} />
 <StatCard label="Deployment type" value={deployment.deploymentType} detail={deployment.rolloutStrategy} />
 <StatCard label="Deployed by" value={deployment.deployedBy} detail={deployment.deployedAt} />
 </section>

 <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
 <div className="grid gap-6">
 <article className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Deployment metadata</h2>
 <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
 <div>
 <dt className="font-medium text-muted">Service name</dt>
 <dd className="mt-1 font-semibold text-slate-800">{deployment.service}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Version</dt>
 <dd className="mt-1 font-semibold text-slate-800">{deployment.version}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Commit SHA</dt>
 <dd className="mt-1 font-semibold text-slate-800">{deployment.commit}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Docker Hub image tag</dt>
 <dd className="mt-1 break-all font-semibold text-slate-800">{deployment.image}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">GitHub Actions status</dt>
 <dd className="mt-1"><StatusBadge label={deployment.githubActionsStatus} tone={statusTone(deployment.githubActionsStatus)} /></dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Deployment type</dt>
 <dd className="mt-1"><StatusBadge label={deployment.deploymentType} /></dd>
 </div>
 <div>
 <dt className="font-medium text-muted">ArgoCD sync status</dt>
 <dd className="mt-1"><StatusBadge label={deployment.argoCdSyncStatus} tone={statusTone(deployment.argoCdSyncStatus)} /></dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Rollout status</dt>
 <dd className="mt-1"><StatusBadge label={deployment.rolloutStatus} tone={statusTone(deployment.rolloutStatus)} /></dd>
 </div>
 </dl>
 </article>

 <ReleaseTimelinePanel
 title="Release Timeline"
 description={`Code, CI, GitOps, ArgoCD, rollout, and rollback activity for ${deployment.service} ${deployment.version}.`}
 events={releaseEvents}
 logs={[]}
 compact
 />

 {runtime.warnings.length ? (
 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Runtime Integration Messages</h2>
 <div className="mt-3 grid gap-2">
 {runtime.warnings.map((warning) => (
 <p key={warning} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">{warning.includes("not configured") ? "Integration not configured" : warning}</p>
 ))}
 </div>
 </section>
 ) : null}

 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Deployment logs</h2>
 <p className="mt-2 rounded-md border border-line bg-canvas px-4 py-3 text-sm text-muted">No deployment logs found from configured integrations.</p>
 </section>
 </div>

 <aside className="grid content-start gap-6">
 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Health checks</h2>
 <div className="mt-4 space-y-3">
 {deployment.healthChecks.map((check) => (
 <div key={check.name} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-2">
 <span className="text-sm font-medium text-slate-800">{check.name}</span>
 <StatusBadge label={check.status} tone={check.tone} />
 </div>
 ))}
 </div>
 </section>

 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Rollback panel</h2>
 <p className="mt-2 text-sm leading-6 text-muted">
 Choose a previous stable version and record a rollback request. No GitOps, ArgoCD, Argo Rollouts, or Kubernetes action will run.
 </p>
 <div className="mt-4 space-y-3">
 {deployment.previousStableVersions.map((version) => (
 <div key={version.version} className="rounded-md border border-line bg-white p-3">
 <p className="text-sm font-semibold text-slate-800">{version.version}</p>
 <p className="mt-1 break-all text-xs text-muted">{version.image}</p>
 <p className="mt-1 text-xs text-muted">{version.commit} · {version.deployedAt}</p>
 </div>
 ))}
 </div>
 <div className="mt-4">
 <RollbackButton deployment={deployment} />
 </div>
 </section>
 </aside>
 </section>
 </>
 );
}

function runtimeTimelineEvents(runtime: RuntimeStatusSnapshot, environment: EnvironmentName): ReleaseTimelineEvent[] {
 return runtime.timelineEvents.map((event) => ({
 id: event.id,
 serviceId: runtime.serviceId,
 deploymentId: `${runtime.serviceId}-runtime`,
 release: "runtime",
 environment,
 type: event.source === "Kyverno" ? "policy" : event.source === "Crossplane" ? "provisioning" : event.source === "ArgoCD" ? "argocd" : event.source === "Cluster" ? "rollout" : "ci",
 label: event.label,
 detail: event.detail,
 time: event.time,
 status: event.status,
 tone: event.tone,
 source: event.source
 }));
}
