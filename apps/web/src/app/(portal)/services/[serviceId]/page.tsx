import { DataTable } from "@/components/DataTable";
import { RollbackButton, ViewLogsButton } from "@/components/DeploymentActions";
import { EnvironmentPromotion } from "@/components/EnvironmentPromotion";
import { OwnershipGraph } from "@/components/OwnershipGraph";
import { PageHeader } from "@/components/PageHeader";
import { ServiceDetailTabs } from "@/components/ServiceDetailTabs";
import { ServiceTopologyGraph } from "@/components/ServiceTopologyGraph";
import { StatusBadge } from "@/components/StatusBadge";
import { getPersistedService, toCatalogApiService } from "@/lib/server/catalog";
import {
 auditLogs,
 deployments,
 getPromotionByServiceId,
 getScorecardByServiceId,
 getServiceById,
 getServiceDependents,
 getServiceResources,
 getTeamById,
 services
} from "@/lib/mock-data";
import { statusTone } from "@/lib/status";
import Link from "next/link";
import { notFound } from "next/navigation";

type ServiceDetailPageProps = {
 params: Promise<{
 serviceId: string;
 }>;
};

export function generateStaticParams() {
 return services.map((service) => ({ serviceId: service.id }));
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
 const { serviceId } = await params;
 const persistedService = await getPersistedService(serviceId).catch(() => null);

 if (persistedService) {
 return <PersistedServiceDetail service={toCatalogApiService(persistedService)} />;
 }

 const service = getServiceById(serviceId);

 if (!service) {
 notFound();
 }

 const team = getTeamById(service.teamId);
 const serviceResources = getServiceResources(service.id);
 const dependents = getServiceDependents(service.id);
 const promotion = getPromotionByServiceId(service.id);
 const detailedScorecard = getScorecardByServiceId(service.id);
 const teamServices = team ? services.filter((candidate) => candidate.teamId === team.id) : [service];

 const serviceDeployments = deployments
 .filter((deployment) => deployment.serviceId === service.id)
 .map((deployment) => ({
 version: (
 <Link href={`/deployments/${deployment.id}`} className="font-semibold text-brand hover:text-slate-900">
 {deployment.version}
 </Link>
 ),
 environment: deployment.environment,
 status: <StatusBadge label={deployment.status} tone={deployment.tone} />,
 "commit SHA": deployment.commit,
 "image tag": deployment.image,
 "deployed at": deployment.deployedAt,
 strategy: deployment.rolloutStrategy,
 rollback: <RollbackButton deployment={deployment} compact />,
 logs: <ViewLogsButton deploymentId={deployment.id} />
 }));

 const resourceRows = serviceResources.map((resource) => ({
 name: resource.name,
 type: resource.type,
 environment: resource.environment,
 status: <StatusBadge label={resource.status} tone={statusTone(resource.status)} />
 }));

 const dependencyRows = service.dependencies.map((dependency) => ({
 dependency: dependency.name,
 type: dependency.type,
 environment: dependency.environment,
 health: <StatusBadge label={dependency.health} tone={dependency.tone} />
 }));

 const dependentRows = dependents.map((dependent) => ({
 service: (
 <Link href={`/services/${dependent.id}`} className="font-semibold text-brand hover:text-slate-900">
 {dependent.name}
 </Link>
 ),
 team: dependent.team,
 environment: dependent.environment,
 health: <StatusBadge label={dependent.healthStatus} tone={dependent.healthTone} />
 }));

 const documentationRows = [
 { type: "Repository", link: <MockDocLink href={service.documentation.repository} />, owner: service.documentation.owner },
 { type: "Runbook", link: <MockDocLink href={service.documentation.runbook} />, owner: service.documentation.owner },
 { type: "API docs", link: <MockDocLink href={service.documentation.apiDocs} />, owner: service.documentation.owner },
 { type: "Event docs", link: <MockDocLink href={service.documentation.eventDocs} />, owner: service.documentation.owner }
 ];

 const auditRows = auditLogs
 .filter((log) => log.target.toLowerCase().includes(service.name.toLowerCase()) || log.target.toLowerCase().includes(service.id.replace("-", " ")))
 .map((log) => ({
 actor: log.actor,
 action: log.action,
 target: log.target,
 result: <StatusBadge label={log.result} tone={statusTone(log.result)} />,
 time: log.time
 }));

 return (
 <>
 <PageHeader
 eyebrow="Service intelligence"
 title={service.name}
 description={service.description}
 />

 <ServiceDetailTabs serviceId={service.id} />

 <section id="overview" className="scroll-mt-16 console-panel rounded-md p-4">
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <StatusBadge label={service.healthStatus} tone={service.healthTone} />
 <StatusBadge label={service.deploymentStatus} tone={service.deploymentTone} />
 {service.environments.map((environment) => (
 <span key={environment} className="rounded-md border border-line bg-canvas px-2 py-0.5 text-xs font-medium text-slate-700">{environment}</span>
 ))}
 </div>
 <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
 <MetaTerm label="Team" value={service.team} />
 <MetaTerm label="Owner" value={service.serviceOwner} />
 <MetaTerm label="Version" value={service.currentVersion} />
 <MetaTerm label="Cost" value={service.monthlyCost} />
 </dl>
 </div>
 <div className="min-w-0 rounded-md border border-line bg-canvas p-3 text-xs">
 <p className="font-semibold text-slate-900">Repository</p>
 <p className="mt-1 break-all text-muted">{service.repository}</p>
 <p className="mt-3 font-semibold text-slate-900">Contact</p>
 <p className="mt-1 break-all text-muted">{service.ownerEmail}</p>
 </div>
 </div>
 </section>

 <section id="topology" className="scroll-mt-16 overflow-x-auto">
 <ServiceTopologyGraph service={service} />
 </section>

 <section className="grid scroll-mt-16 gap-6 xl:grid-cols-2">
 <OwnershipGraph teamName={service.team} services={teamServices} resources={serviceResources} />
 <article className="console-panel rounded-md p-4">
 <h2 className="font-heading text-base font-semibold text-ink">Ownership</h2>
 <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
 <div>
 <dt className="font-medium text-muted">Owning team</dt>
 <dd className="mt-1">
 <Link href={`/teams/${service.teamId}`} className="font-semibold text-brand hover:underline">
 {service.team}
 </Link>
 </dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Service owner</dt>
 <dd className="mt-1 text-slate-800">{service.serviceOwner}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Platform contacts</dt>
 <dd className="mt-1 text-slate-800">{service.platformContacts.join(", ")}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Escalation contacts</dt>
 <dd className="mt-1 text-slate-800">{service.escalationContacts.join(", ")}</dd>
 </div>
 </dl>
 </article>
 </section>

 <section id="releases" className="scroll-mt-16">
 {promotion ? <EnvironmentPromotion promotion={promotion} /> : null}
 </section>

 <section className="grid gap-6">
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Deployments</h2>
 <DataTable columns={["version", "environment", "status", "commit SHA", "image tag", "deployed at", "strategy", "rollback", "logs"]} rows={serviceDeployments} />
 </article>

 <article id="resources" className="scroll-mt-16">
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Resources</h2>
 <DataTable columns={["name", "type", "environment", "status"]} rows={resourceRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Dependencies</h2>
 <DataTable columns={["dependency", "type", "environment", "health"]} rows={dependencyRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Dependents</h2>
 <DataTable columns={["service", "team", "environment", "health"]} rows={dependentRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Documentation</h2>
 <DataTable columns={["type", "link", "owner"]} rows={documentationRows} />
 </article>

 <article id="audit" className="scroll-mt-16">
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Audit</h2>
 <DataTable columns={["actor", "action", "target", "result", "time"]} rows={auditRows.length ? auditRows : [{ actor: "Audit log", action: "No service events registered", target: service.name, result: <StatusBadge label="none" tone="neutral" />, time: "N/A" }]} />
 </article>

 {detailedScorecard ? (
 <article className="console-panel rounded-md p-4">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">Scorecards</h2>
 <p className="mt-1 text-sm text-muted">Production-readiness breakdown and remediation guidance.</p>
 </div>
 <StatusBadge
 label={`${detailedScorecard.overallScore}% · ${detailedScorecard.maturityLevel}`}
 tone={detailedScorecard.maturityLevel === "production-ready" ? "success" : detailedScorecard.maturityLevel === "standard" ? "warning" : "danger"}
 />
 </div>
 <div className="mt-4 grid gap-3 md:grid-cols-3">
 <div className="console-subtle rounded-md p-3">
 <p className="text-sm font-semibold text-slate-800">Passed checks</p>
 <p className="mt-1 text-2xl font-semibold text-ink">{detailedScorecard.passedChecks}</p>
 </div>
 <div className="console-subtle rounded-md p-3">
 <p className="text-sm font-semibold text-slate-800">Failed checks</p>
 <p className="mt-1 text-2xl font-semibold text-ink">{detailedScorecard.failedChecks}</p>
 </div>
 <div className="console-subtle rounded-md p-3">
 <p className="text-sm font-semibold text-slate-800">Maturity</p>
 <p className="mt-1 text-2xl font-semibold text-ink">{detailedScorecard.maturityLevel}</p>
 </div>
 </div>
 <div className="mt-5 grid gap-4 lg:grid-cols-2">
 <div>
 <h3 className="text-sm font-semibold text-ink">Failed checks</h3>
 <div className="mt-3 grid gap-2">
 {detailedScorecard.checks.filter((check) => !check.passed).map((check) => (
 <div key={check.name} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
 {check.name}
 </div>
 ))}
 </div>
 </div>
 <div>
 <h3 className="text-sm font-semibold text-ink">Recommended remediation</h3>
 <div className="mt-3 grid gap-2">
 {detailedScorecard.recommendations.map((recommendation) => (
 <div key={recommendation} className="console-subtle rounded-md px-3 py-2 text-sm text-slate-700">
 {recommendation}
 </div>
 ))}
 </div>
 </div>
 </div>
 </article>
 ) : null}
 </section>
 </>
 );
}

type PersistedServiceDetailProps = {
 service: ReturnType<typeof toCatalogApiService>;
};

function PersistedServiceDetail({ service }: PersistedServiceDetailProps) {
 const environmentRows = service.environments.map((environment) => ({
 environment: environment.name,
 version: environment.currentVersion,
 status: <StatusBadge label={environment.status} tone={statusTone(environment.status)} />
 }));
 const capabilityRows = service.capabilities.map((capability) => ({
 capability: capability.name
 }));
 const deploymentRows = service.deployments.map((deployment) => ({
 version: deployment.version,
 environment: deployment.environment,
 status: <StatusBadge label={deployment.status} tone={statusTone(deployment.status)} />,
 "commit SHA": deployment.commitSha,
 "image tag": deployment.imageTag,
 "deployed by": deployment.deployedBy,
 "deployed at": new Date(deployment.deployedAt).toLocaleString(),
 type: deployment.deploymentType
 }));

 return (
 <>
 <PageHeader
 eyebrow="Persisted service"
 title={service.name}
 description={service.description}
 />

 <section className="console-panel rounded-md p-4">
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <StatusBadge label={service.healthStatus} tone={statusTone(service.healthStatus)} />
 <StatusBadge label={service.deploymentStatus} tone={statusTone(service.deploymentStatus)} />
 {service.environments.map((environment) => (
 <span key={environment.id} className="rounded-md border border-line bg-canvas px-2 py-0.5 text-xs font-medium text-slate-700">{environment.name}</span>
 ))}
 </div>
 <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
 <MetaTerm label="Team" value={service.team.name} />
 <MetaTerm label="Owner" value={service.ownerEmail} />
 <MetaTerm label="Version" value={service.currentVersion} />
 <MetaTerm label="Cost" value={`$${service.estimatedMonthlyCost.toLocaleString()}`} />
 </dl>
 </div>
 <div className="min-w-0 rounded-md border border-line bg-canvas p-3 text-xs">
 <p className="font-semibold text-slate-900">Repository</p>
 <p className="mt-1 break-all text-muted">{service.repositoryUrl}</p>
 <p className="mt-3 font-semibold text-slate-900">Image</p>
 <p className="mt-1 break-all text-muted">{service.dockerImage}</p>
 </div>
 </div>
 </section>

 <section className="grid gap-6">
 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Environments</h2>
 <DataTable columns={["environment", "version", "status"]} rows={environmentRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Capabilities</h2>
 <DataTable columns={["capability"]} rows={capabilityRows} />
 </article>

 <article>
 <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Deployments</h2>
 <DataTable columns={["version", "environment", "status", "commit SHA", "image tag", "deployed by", "deployed at", "type"]} rows={deploymentRows} />
 </article>
 </section>
 </>
 );
}

function MetaTerm({ label, value }: { label: string; value: string }) {
 return (
 <div>
 <dt className="font-medium uppercase tracking-[0.12em] text-muted">{label}</dt>
 <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
 </div>
 );
}

function MockDocLink({ href }: { href: string }) {
 return (
 <span className="font-medium text-brand">
 {href}
 </span>
 );
}
