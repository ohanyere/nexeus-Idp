import { DataTable } from "@/components/DataTable";
import { InviteMemberButton } from "@/components/InviteMemberButton";
import { OwnershipGraph } from "@/components/OwnershipGraph";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getTeamProfile } from "@/lib/auth";
import { deployments, getTeamById, getTeamResources, getTeamServices, teams } from "@/lib/mock-data";
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
 const profile = getTeamProfile(team.id);
 const ownedServiceIds = new Set(ownedServices.map((service) => service.id));

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

 const deploymentRows = deployments
 .filter((deployment) => ownedServiceIds.has(deployment.serviceId))
 .map((deployment) => ({
 service: deployment.service,
 version: deployment.version,
 environment: deployment.environment,
 status: <StatusBadge label={deployment.status} tone={deployment.tone} />,
 "deployed at": deployment.deployedAt
 }));

 return (
 <>
 <PageHeader
 eyebrow="Team detail"
 title={team.name}
 description={team.ownership}
 action={<InviteMemberButton teamId={team.id} />}
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
 {profile ? (
 <article className="console-panel rounded-md p-5">
 <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">Team overview</h2>
 <p className="mt-1 text-sm text-muted">{profile.owner} owns team operations and access review.</p>
 </div>
 <StatusBadge label={profile.environmentAccess.join(", ")} />
 </div>
 <dl className="mt-4 grid gap-4 text-sm md:grid-cols-3">
 <Meta label="Owner" value={profile.owner} />
 <Meta label="Slack channel" value={profile.slackChannel} />
 <Meta label="GitHub organization" value={profile.githubOrganization} />
 <Meta label="Cost center" value={profile.costCenter} />
 <Meta label="Environment access" value={profile.environmentAccess.join(", ")} />
 <Meta label="Owned services" value={String(profile.ownedServiceIds.length)} />
 </dl>
 </article>
 ) : null}

 {profile ? (
 <article className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Members</h2>
 <div className="mt-4 grid gap-3 md:grid-cols-2">
 {profile.members.map((member) => (
 <div key={member.id} className="rounded-md border border-line bg-white p-3">
 <div className="flex items-start gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">{member.avatar}</div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <h3 className="truncate text-sm font-semibold text-ink">{member.name}</h3>
 <StatusBadge label={member.status} tone={member.status === "Active" ? "success" : member.status === "Away" ? "warning" : "neutral"} />
 </div>
 <p className="mt-1 truncate text-xs text-muted">{member.email}</p>
 <p className="mt-1 text-xs text-muted">{member.role} · {member.lastActive}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </article>
 ) : null}

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Owned services</h2>
 <DataTable columns={["service", "owner", "template", "environment", "health", "cost"]} rows={serviceRows} />
 </article>
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Owned resources</h2>
 <DataTable columns={["resource", "type", "service", "environment", "status"]} rows={resourceRows} />
 </article>
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Deployment history</h2>
 <DataTable columns={["service", "version", "environment", "status", "deployed at"]} rows={deploymentRows} />
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

function Meta({ label, value }: { label: string; value: string }) {
 return (
 <div>
 <dt className="font-medium text-muted">{label}</dt>
 <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
 </div>
 );
}
