import { DataTable } from "@/components/DataTable";
import { MockActionButton } from "@/components/MockActionButton";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { driftFindings } from "@/lib/mock-data";
import Link from "next/link";

export default function DriftPage() {
 const critical = driftFindings.filter((finding) => finding.severity === "critical").length;
 const high = driftFindings.filter((finding) => finding.severity === "high").length;

 const rows = driftFindings.map((finding) => ({
 service: (
 <Link href={`/services/${finding.serviceId}`} className="font-semibold text-brand hover:text-slate-900">
 {finding.service}
 </Link>
 ),
 environment: finding.environment,
 resource: finding.resource,
 "desired state": finding.desiredState,
 "live state": finding.liveState,
 "drift type": finding.driftType,
 severity: <StatusBadge label={finding.severity} tone={finding.tone} />,
 "detected at": finding.detectedAt,
 "recommended action": finding.recommendedAction,
 actions: (
 <div className="flex flex-wrap gap-2">
 <MockActionButton label="View Diff" result={`${finding.service} drift diff opened in demo mode.`} tone="info" />
 <MockActionButton label="Reconcile" result={`${finding.service} reconcile request recorded as mock-only.`} />
 <MockActionButton label="Ignore Temporarily" result={`${finding.service} drift finding ignored temporarily in demo mode.`} tone="warning" />
 </div>
 )
 }));

 return (
 <>
 <PageHeader title="Drift detection" description="Mock GitOps drift findings comparing desired state with live state. Actions are visual only." />
 <section className="grid gap-4 md:grid-cols-4">
 <StatCard label="Open findings" value={String(driftFindings.length)} detail="Mock drift records" />
 <StatCard label="Critical" value={String(critical)} detail="Needs immediate review" tone="danger" />
 <StatCard label="High severity" value={String(high)} detail="Manual changes suspected" tone="warning" />
 <StatCard label="Reconciled today" value="1" detail="Mock audit event" tone="success" />
 </section>
 <DataTable columns={["service", "environment", "resource", "desired state", "live state", "drift type", "severity", "detected at", "recommended action", "actions"]} rows={rows} />
 </>
 );
}
