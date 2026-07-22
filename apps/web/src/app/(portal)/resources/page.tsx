import { DataTable } from "@/components/DataTable";
import { MockActionButton } from "@/components/MockActionButton";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { provisionedResources, resourceOfferings } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";

export default function ResourcesPage() {
 const rows = provisionedResources.map((resource) => ({
 name: resource.name,
 type: resource.type,
 service: resource.service,
 team: resource.owner,
 environment: resource.environment,
 status: <StatusBadge label={resource.status} tone={statusTone(resource.status)} />
 }));

 return (
 <>
 <PageHeader
 title="Resources"
 description="Review resource marketplace claims and provisioned resources across platform integrations."
 />
 <section className="grid gap-4 md:grid-cols-3">
 <StatCard label="Marketplace items" value={String(resourceOfferings.length)} detail="Resource offerings" />
 <StatCard label="Provisioned" value={String(provisionedResources.length)} detail="Resource records" />
 <StatCard label="Provisioning" value="1" detail="Active workflow" tone="warning" />
 </section>
 <section className="grid gap-4 lg:grid-cols-5">
 {resourceOfferings.map((offering) => {
 const Icon = offering.icon;

 return (
 <article key={offering.name} className="console-panel rounded-md p-4 transition hover:shadow-none">
 <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white shadow-none">
 <Icon className="h-5 w-5" aria-hidden="true" />
 </div>
 <h2 className="mt-4 font-heading text-lg font-semibold text-ink">{offering.name}</h2>
 <p className="mt-2 text-sm leading-6 text-muted">{offering.description}</p>
 <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{offering.capability}</p>
 <div className="mt-4">
 <MockActionButton label="Request Resource" result={`${offering.name} request recorded.`} />
 </div>
 </article>
 );
 })}
 </section>
 <DataTable columns={["name", "type", "service", "team", "environment", "status"]} rows={rows} />
 </>
 );
}
