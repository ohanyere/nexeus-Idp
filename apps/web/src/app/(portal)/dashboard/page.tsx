import { ActivityFeed } from "@/components/ActivityFeed";
import { PageHeader } from "@/components/PageHeader";
import { PersonalDashboard } from "@/components/PersonalDashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { TopologyFlow } from "@/components/TopologyFlow";
import {
 activityItems,
 deployments,
 governancePolicyChecks,
 platformHealthOperational,
 services
} from "@/lib/mock-data";
import type { StatusTone } from "@/lib/mock-data";

export default function DashboardPage() {
 const unhealthySystems = platformHealthOperational.filter((system) => system.tone !== "success");
 const activeDeployments = deployments.filter((deployment) =>
 ["info", "warning", "drift", "danger"].includes(deployment.tone)
 );
 const incidents = services.filter((service) => service.healthTone === "danger" || service.deploymentTone === "danger");
 const servicesRequiringAttention = services.filter((service) => service.healthTone !== "success" || service.deploymentTone !== "success");
 const governanceAlerts = governancePolicyChecks.filter((check) => check.status === "Fail");

 return (
 <>
 <PageHeader
 eyebrow="Personal workspace"
 title="My Dashboard"
 description="A personalized Nexus Platform landing page for your services, teams, approvals, deployments, notifications, and audit activity."
 />

 <PersonalDashboard />

 <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
 <OperationalMetric
 label="Platform Health"
 value={unhealthySystems.length === 0 ? "Healthy" : `${unhealthySystems.length} degraded`}
 detail={`${platformHealthOperational.length} systems monitored`}
 tone={unhealthySystems.length === 0 ? "success" : "warning"}
 />
 <OperationalMetric
 label="Active Deployments"
 value={String(activeDeployments.length)}
 detail="Rollouts, builds, drift, or failed states"
 tone={activeDeployments.length > 0 ? "info" : "success"}
 />
 <OperationalMetric
 label="Incidents"
 value={String(incidents.length)}
 detail="Services in failed or rollback states"
 tone={incidents.length > 0 ? "danger" : "success"}
 />
 <OperationalMetric
 label="Monthly Cost"
 value="$38.8k"
 detail="Mock platform allocation"
 tone="neutral"
 />
 </section>

 <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
 <div className="grid min-w-0 gap-4">
 <section className="console-panel rounded-md">
 <div className="border-b border-line px-4 py-3">
 <h2 className="font-heading text-base font-semibold text-ink">Platform health</h2>
 <p className="mt-1 text-xs text-muted">Dependency status, uptime, and last mock check.</p>
 </div>
 <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
 {platformHealthOperational.map((system) => (
 <div key={system.name} className="min-w-0 px-4 py-3">
 <div className="flex items-center justify-between gap-3">
 <span className="truncate text-xs font-semibold text-slate-900">{system.name}</span>
 <StatusBadge label={system.status} tone={system.tone} />
 </div>
 <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
 <div>
 <dt className="text-muted">Uptime</dt>
 <dd className="mt-0.5 font-medium text-slate-800">{system.uptime}</dd>
 </div>
 <div>
 <dt className="text-muted">Last check</dt>
 <dd className="mt-0.5 font-medium text-slate-800">{system.lastCheck}</dd>
 </div>
 </dl>
 </div>
 ))}
 </div>
 </section>
 <TopologyFlow services={services} title="Platform topology" height="430px" />
 </div>
 <ActivityFeed items={activityItems} />
 </section>

 <section className="grid min-w-0 gap-4 xl:grid-cols-2">
 <section className="console-panel min-w-0 rounded-md">
 <SectionHeader title="Services requiring attention" detail={`${servicesRequiringAttention.length} catalog records need review`} />
 <div className="divide-y divide-line">
 {servicesRequiringAttention.map((service) => (
 <article key={service.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]">
 <div className="min-w-0">
 <h3 className="truncate text-sm font-semibold text-slate-900">{service.name}</h3>
 <p className="mt-1 text-xs text-muted">{service.team} · {service.environment} · {service.currentVersion}</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <StatusBadge label={service.healthStatus} tone={service.healthTone} />
 <StatusBadge label={service.deploymentStatus} tone={service.deploymentTone} />
 </div>
 </article>
 ))}
 </div>
 </section>

 <section className="console-panel min-w-0 rounded-md">
 <SectionHeader title="Governance alerts" detail={`${governanceAlerts.length} failing policy checks`} />
 <div className="divide-y divide-line">
 {governanceAlerts.map((alert) => (
 <article key={`${alert.service}-${alert.policy}`} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]">
 <div className="min-w-0">
 <h3 className="truncate text-sm font-semibold text-slate-900">{alert.policy}</h3>
 <p className="mt-1 text-xs text-muted">{alert.service} · {alert.environment}</p>
 </div>
 <StatusBadge label={alert.status} tone={alert.tone} />
 </article>
 ))}
 </div>
 </section>
 </section>

 <section className="console-panel min-w-0 rounded-md">
 <SectionHeader title="Recent deployments timeline" detail="Latest rollout and promotion activity across environments" />
 <div className="divide-y divide-line">
 {deployments.map((deployment) => (
 <article key={deployment.id} className="grid gap-3 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
 <div className="text-xs text-muted">{deployment.deployedAt}</div>
 <div className="min-w-0">
 <h3 className="truncate text-sm font-semibold text-slate-900">{deployment.service} · {deployment.version}</h3>
 <p className="mt-1 text-xs text-muted">{deployment.environment} · {deployment.deploymentType} · {deployment.rolloutStrategy}</p>
 </div>
 <StatusBadge label={deployment.status} tone={deployment.tone} />
 </article>
 ))}
 </div>
 </section>
 </>
 );
}

function OperationalMetric({
 label,
 value,
 detail,
 tone
}: {
 label: string;
 value: string;
 detail: string;
 tone: StatusTone;
}) {
 return (
 <section className="console-panel rounded-md p-4">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
 <p className="mt-2 font-heading text-xl font-semibold text-ink">{value}</p>
 <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
 </div>
 <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-md ${dotColor(tone)}`} />
 </div>
 </section>
 );
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
 return (
 <div className="border-b border-line px-4 py-3">
 <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
 <p className="mt-1 text-xs text-muted">{detail}</p>
 </div>
 );
}

function dotColor(tone: StatusTone) {
 const colors: Record<StatusTone, string> = {
 success: "bg-emerald-600",
 warning: "bg-amber-600",
 danger: "bg-red-600",
 info: "bg-slate-500",
 drift: "bg-violet-600",
 neutral: "bg-slate-500"
 };

 return colors[tone];
}
