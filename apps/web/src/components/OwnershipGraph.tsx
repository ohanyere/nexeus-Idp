import { StatusBadge } from "@/components/StatusBadge";
import type { Service, StatusTone } from "@/lib/mock-data";
import type { ReactNode } from "react";

type ResourceNode = {
 name: string;
 type: string;
 status: string;
};

type OwnershipGraphProps = {
 teamName: string;
 services: Array<Pick<Service, "id" | "name" | "serviceOwner" | "healthStatus" | "healthTone">>;
 resources: ResourceNode[];
};

export function OwnershipGraph({ teamName, services, resources }: OwnershipGraphProps) {
 return (
 <section className="console-panel min-w-0 rounded-md p-4">
 <h2 className="font-heading text-base font-semibold text-ink">Ownership map</h2>
 <div className="mt-4 grid gap-4 lg:grid-cols-3">
 <Column title="Team">
 <GraphNode label={teamName} detail="Primary ownership boundary" tone="neutral" />
 </Column>
 <Column title="Services">
 <div className="grid gap-2">
 {services.map((service) => (
 <GraphNode
 key={service.id}
 label={service.name}
 detail={`Owner: ${service.serviceOwner}`}
 tone={service.healthTone}
 badge={service.healthStatus}
 />
 ))}
 </div>
 </Column>
 <Column title="Resources">
 <div className="grid gap-2">
 {resources.map((resource) => (
 <GraphNode
 key={resource.name}
 label={resource.name}
 detail={resource.type}
 tone="neutral"
 badge={resource.status}
 />
 ))}
 </div>
 </Column>
 </div>
 </section>
 );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
 return (
 <div className="min-w-0 rounded-md border border-line bg-canvas p-3">
 <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
 {children}
 </div>
 );
}

function GraphNode({
 label,
 detail,
 tone,
 badge
}: {
 label: string;
 detail: string;
 tone: StatusTone;
 badge?: string;
}) {
 return (
 <div className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-line bg-white px-3 py-2">
 <div className="min-w-0">
 <p className="text-sm font-semibold text-slate-800">{label}</p>
 <p className="mt-1 text-xs text-muted">{detail}</p>
 </div>
 {badge ? <StatusBadge label={badge} tone={tone} /> : null}
 </div>
 );
}
