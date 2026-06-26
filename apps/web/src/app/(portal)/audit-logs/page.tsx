import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { auditLogs } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";

export default function AuditLogsPage() {
 const rows = auditLogs.map((log) => ({
 actor: log.actor,
 action: log.action,
 target: log.target,
 result: <StatusBadge label={log.result} tone={statusTone(log.result)} />,
 time: log.time
 }));

 return (
 <>
 <PageHeader
 title="Audit logs"
 description="Review append-only audit event placeholders for operational actions, ownership changes, and template publishing."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Events" value={String(auditLogs.length)} detail="Mock audit trail" />
 <StatCard label="Pending or open" value="2" detail="Rollback and drift placeholders" tone="warning" />
 <StatCard label="Failed actions" value="1" detail="Policy violation mock event" tone="danger" />
 </section>
 <DataTable columns={["actor", "action", "target", "result", "time"]} rows={rows} />
 </>
 );
}
