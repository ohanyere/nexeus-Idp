import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { platformHealthSignals } from "@/lib/mock-data";

export default function PlatformHealthPage() {
 const warningCount = platformHealthSignals.filter((signal) => signal.tone !== "success").length;

 return (
 <>
 <PageHeader
 title="Platform health"
 description="Surface integration and runtime health placeholders with explicit freshness labels before live sync workers are built."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Platform status" value="Nominal" detail="Mock rollup" tone="success" />
 <StatCard label="Live integrations" value="0" detail="All sources are placeholders" />
 <StatCard label="Warnings" value={String(warningCount)} detail="Mock provider concerns" tone="warning" />
 </section>
 <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 {platformHealthSignals.map((signal) => {
 const Icon = signal.icon;

 return (
 <article key={signal.name} className="console-panel rounded-md p-5">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white shadow-none">
 <Icon className="h-5 w-5" aria-hidden="true" />
 </div>
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">{signal.name}</h2>
 <p className="text-sm text-muted">{signal.freshness}</p>
 </div>
 </div>
 <StatusBadge label={signal.status} tone={signal.tone} />
 </div>
 </article>
 );
 })}
 </section>
 </>
 );
}
