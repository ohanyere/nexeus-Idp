import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { auditLogs } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";

export default function AuditLogsPage() {
 const promotionEvents = auditLogs.filter((log) => log.action.startsWith("promotion."));
 const pendingEvents = auditLogs.filter((log) => ["pending", "open"].includes(log.result));
 const failedEvents = auditLogs.filter((log) => ["failed", "blocked"].includes(log.result));
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
 description="Review release, promotion, catalog, policy, and operational audit events."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Events" value={String(auditLogs.length)} detail="Append-only audit trail" />
 <StatCard label="Promotion events" value={String(promotionEvents.length)} detail="Release workflow records" tone="info" />
 <StatCard label="Pending or failed" value={String(pendingEvents.length + failedEvents.length)} detail="Needs owner or platform attention" tone="warning" />
 </section>
 <DataTable columns={["actor", "action", "target", "result", "time"]} rows={rows} />
 </>
 );
}
