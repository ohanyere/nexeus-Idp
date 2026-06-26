import { DataTable } from "@/components/DataTable";
import { OwnershipGraph } from "@/components/OwnershipGraph";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getTeamById, getTeamResources, getTeamServices, teams } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";
import Link from "next/link";
import { notFound } from "next/navigation";

type TeamDetailPageProps = {
 params: Promise<{
 teamId: string;
 }>;
};

export function generateStaticParams() {
 return teams.map((team) => ({ teamId: team.id }));
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
 const { teamId } = await params;
 const team = getTeamById(teamId);

 if (!team) {
 notFound();
 }

 const ownedServices = getTeamServices(team.id);
 const ownedResources = getTeamResources(team.id);

 const serviceRows = ownedServices.map((service) => ({
 service: (
 <Link href={`/services/${service.id}`} className="font-semibold text-brand hover:text-slate-900">
 {service.name}
 </Link>
 ),
 owner: service.serviceOwner,
 template: service.template,
 environment: service.environment,
 health: <StatusBadge label={service.healthStatus} tone={service.healthTone} />,
 cost: service.monthlyCost
 }));

 const resourceRows = ownedResources.map((resource) => ({
 resource: resource.name,
 type: resource.type,
 service: resource.service,
 environment: resource.environment,
 status: <StatusBadge label={resource.status} tone={statusTone(resource.status)} />
 }));

 return (
 <>
 <PageHeader
 eyebrow="Team detail"
 title={team.name}
 description={team.ownership}
 />

 <section className="grid gap-4 md:grid-cols-5">
 <StatCard label="Monthly cost" value={team.monthlyCost} detail="Mock allocation" />
 <StatCard label="Owned services" value={String(ownedServices.length)} detail="Catalog entries" />
 <StatCard label="Deployments" value={String(team.deploymentsThisMonth)} detail="This month" />
 <StatCard label="Incidents" value={String(team.incidentsThisMonth)} detail="This month" tone={team.incidentsThisMonth > 0 ? "warning" : "success"} />
 <StatCard label="Policy violations" value={String(team.policyViolations)} detail="Open findings" tone={team.policyViolations > 0 ? "danger" : "success"} />
 </section>

 <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
 <div className="grid gap-6">
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Owned services</h2>
 <DataTable columns={["service", "owner", "template", "environment", "health", "cost"]} rows={serviceRows} />
 </article>
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Owned resources</h2>
 <DataTable columns={["resource", "type", "service", "environment", "status"]} rows={resourceRows} />
 </article>
 </div>

 <div className="grid content-start gap-6">
 <article className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Contacts</h2>
 <dl className="mt-4 grid gap-4 text-sm">
 <div>
 <dt className="font-medium text-muted">Platform contacts</dt>
 <dd className="mt-1 text-slate-800">{team.platformContacts.join(", ")}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Escalation contacts</dt>
 <dd className="mt-1 text-slate-800">{team.escalationContacts.join(", ")}</dd>
 </div>
 </dl>
 </article>
 <OwnershipGraph teamName={team.name} services={ownedServices} resources={ownedResources} />
 </div>
 </section>
 </>
 );
}
