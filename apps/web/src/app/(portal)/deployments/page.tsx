import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { environmentPromotions, getServiceById } from "@/lib/mock-data";
import Link from "next/link";

export default function DeploymentsPage() {
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
