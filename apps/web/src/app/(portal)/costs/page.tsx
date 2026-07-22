import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { costs } from "@/lib/mock-data";

export default function CostsPage() {
 const rows = costs.map((item) => ({
 scope: item.scope,
 "month to date": item.monthToDate,
 trend: item.trend,
 driver: item.driver
 }));

 return (
 <>
 <PageHeader
 title="Costs"
 description="Review month-to-date platform cost allocation by team."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Month to date" value="$38.8k" detail="Allocation total" />
 <StatCard label="Largest driver" value="Commerce" detail="Checkout and catalog workloads" tone="warning" />
 <StatCard label="Unallocated" value="$0" detail="All costs are assigned" tone="success" />
 </section>
 <DataTable columns={["scope", "month to date", "trend", "driver"]} rows={rows} />
 </>
 );
}
