import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { governancePolicyChecks } from "@/lib/mock-data";

export default function GovernancePage() {
 const failed = governancePolicyChecks.filter((check) => check.status === "Fail").length;
 const rows = governancePolicyChecks.map((check) => ({
 policy: check.policy,
 service: check.service,
 environment: check.environment,
 status: <StatusBadge label={check.status} tone={check.tone} />
 }));

 return (
 <>
 <PageHeader
 title="Governance"
 description="Track scorecard and policy visibility with placeholder results before Kyverno, drift, and scorecard workers are connected."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Policy checks" value={String(governancePolicyChecks.length)} detail="Mock service evaluations" />
 <StatCard label="Passing" value={String(governancePolicyChecks.length - failed)} detail="Across visible services" tone="success" />
 <StatCard label="Failing" value={String(failed)} detail="Requires service owner review" tone="danger" />
 </section>
 <DataTable columns={["policy", "service", "environment", "status"]} rows={rows} />
 </>
 );
}
