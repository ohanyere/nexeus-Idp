import { DataTable } from "@/components/DataTable";
import { MockActionButton } from "@/components/MockActionButton";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { disasterRecoveryRecords } from "@/lib/mock-data";
import Link from "next/link";

export default function DisasterRecoveryPage() {
 const ready = disasterRecoveryRecords.filter((record) => record.readinessStatus === "Ready").length;
 const gaps = disasterRecoveryRecords.filter((record) => record.readinessTone === "danger").length;
 const backupHealthy = disasterRecoveryRecords.filter((record) => record.backupTone === "success").length;
 const restoreTested = disasterRecoveryRecords.filter((record) => !["Never", "N/A"].includes(record.lastRestoreTest)).length;

 const rows = disasterRecoveryRecords.map((record) => ({
 service: (
 <Link href={`/services/${record.serviceId}`} className="font-semibold text-brand hover:text-slate-900">
 {record.service}
 </Link>
 ),
 criticality: record.criticality,
 "backup status": <StatusBadge label={record.backupStatus} tone={record.backupTone} />,
 "last backup": record.lastBackupTime,
 "last restore test": record.lastRestoreTest,
 RPO: record.rpo,
 RTO: record.rto,
 "DR readiness": <StatusBadge label={record.readinessStatus} tone={record.readinessTone} />,
 runbook: <span className="font-medium text-brand">{record.runbook}</span>
 }));

 return (
 <>
 <PageHeader title="Disaster recovery" description="Mock DR readiness for services and resources, including backup coverage, restore tests, RPO/RTO, and recovery runbooks." />
 <section className="grid gap-4 md:grid-cols-5">
 <StatCard label="Backup coverage" value={`${backupHealthy}/${disasterRecoveryRecords.length}`} detail="Healthy backup records" tone={backupHealthy >= 3 ? "success" : "warning"} />
 <StatCard label="Restore tested" value={`${restoreTested}/${disasterRecoveryRecords.length}`} detail="Has restore evidence" tone="warning" />
 <StatCard label="Critical gaps" value={String(gaps)} detail="Services without DR" tone={gaps > 0 ? "danger" : "success"} />
 <StatCard label="Database backup health" value="2/3" detail="Mock database resources" tone="warning" />
 <StatCard label="Ready services" value={String(ready)} detail="Production DR posture" tone="success" />
 </section>

 <section className="grid gap-4 lg:grid-cols-4">
 <SummaryCard title="Recovery readiness summary" body="Payments is ready. Checkout and Catalog need restore-test refresh. Orders Worker has a DR gap." />
 <SummaryCard title="Critical services without DR" body="Orders Worker has no backup evidence and unknown RPO/RTO." />
 <SummaryCard title="Restore test status" body="2 services have recent restore-test metadata. 1 service has never been tested." />
 <SummaryCard title="Database backup health" body="payments-postgres and orders-postgres are healthy. Catalog assets are partial." />
 </section>

 <section className="console-panel flex flex-col gap-3 rounded-md p-5 md:flex-row md:items-center md:justify-between">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">Restore test workflow</h2>
 <p className="mt-1 text-sm text-muted">Record a mock restore-test completion without touching backup systems or infrastructure.</p>
 </div>
 <MockActionButton label="Complete Restore Test" result="Restore test completion recorded as mock-only." celebrate />
 </section>

 <DataTable columns={["service", "criticality", "backup status", "last backup", "last restore test", "RPO", "RTO", "DR readiness", "runbook"]} rows={rows} />
 </>
 );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
 return (
 <article className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
 <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
 </article>
 );
}
