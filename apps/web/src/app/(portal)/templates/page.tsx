import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { templates } from "@/lib/mock-data";

export default function TemplatesPage() {
 return (
 <>
 <PageHeader
 title="Golden path templates"
 description="Approved service creation paths are represented as template metadata only; repository generation is not connected yet."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Templates" value={String(templates.length)} detail="Published versions" />
 <StatCard label="Pending requests" value="1" detail="Repository workflow" tone="warning" />
 <StatCard label="Connected providers" value="0" detail="GitHub is intentionally offline" />
 </section>
 <section className="grid gap-4 lg:grid-cols-2">
 {templates.map((template) => (
 <article key={template.name} className="console-panel rounded-md p-5">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <h2 className="font-heading text-xl font-semibold text-ink">{template.name}</h2>
 <p className="mt-1 text-sm text-muted">Version {template.version} maintained by {template.owner}</p>
 </div>
 <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
 {template.adoptionCount} services
 </span>
 </div>
 <div className="mt-4 flex flex-wrap gap-2">
 {template.capabilities.map((capability) => (
 <span key={capability} className="rounded-md border border-line bg-white px-2 py-1 text-xs text-slate-700">
 {capability}
 </span>
 ))}
 </div>
 </article>
 ))}
 </section>
 </>
 );
}
