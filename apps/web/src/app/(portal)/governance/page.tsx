import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getGovernanceDashboard, postureTone, severityTone } from "@/lib/governance";
import Link from "next/link";

export default function GovernancePage() {
  const dashboard = getGovernanceDashboard();
  const criticalAndHigh = dashboard.activeViolations.filter((violation) => violation.severity === "critical" || violation.severity === "high").length;

  const riskyServiceRows = dashboard.topRiskyServices.map((service) => ({
    service: (
      <Link href={`/services/${service.serviceId}#policy`} className="font-semibold text-brand hover:underline">
        {service.service}
      </Link>
    ),
    team: service.team,
    score: `${service.score}%`,
    posture: <StatusBadge label={service.posture} tone={postureTone(service.posture)} />,
    "failed checks": service.failingPolicies,
    "last evaluated": service.lastEvaluatedAt
  }));

  const eventRows = dashboard.recentPolicyEvents.map((event) => ({
    time: event.time,
    service: event.service,
    team: event.team,
    environment: event.environment,
    event: event.event,
    result: <StatusBadge label={event.result} tone={event.tone} />
  }));

  return (
    <div className="grid min-w-[1080px] gap-5">
      <PageHeader
        eyebrow="Policy and governance"
        title="Governance"
        description="Enterprise policy posture across services, teams, environments, and Kubernetes admission-style controls."
        action={
          <div className="flex items-center gap-2">
            <Link href="/governance/policies" className="inline-flex h-8 items-center rounded-md border border-line bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-canvas">
              Policy Catalog
            </Link>
            <Link href="/governance/violations" className="inline-flex h-8 items-center rounded-md border border-slate-950 bg-slate-950 px-2.5 text-xs font-semibold text-white hover:bg-slate-800">
              View Violations
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Compliance score" value={`${dashboard.overallScore}%`} detail="Service-weighted mock posture" tone={dashboard.overallScore >= 85 ? "success" : "warning"} />
        <StatCard label="Active violations" value={String(dashboard.activeViolations.length)} detail="Open, in progress, or accepted risk" tone="warning" />
        <StatCard label="Critical or high" value={String(criticalAndHigh)} detail="Needs platform review" tone={criticalAndHigh ? "danger" : "success"} />
        <StatCard label="Teams at risk" value={String(dashboard.violationsByTeam.filter((team) => team.openViolations > 0).length)} detail="Open team findings" tone="warning" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="console-panel rounded-md p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold text-ink">Violations by severity</h2>
              <p className="mt-1 text-xs text-muted">Active findings grouped by policy severity.</p>
            </div>
            <Link href="/governance/violations" className="text-xs font-semibold text-brand hover:underline">Open table</Link>
          </div>
          <div className="mt-4 grid gap-2">
            {dashboard.violationsBySeverity.map((item) => (
              <div key={item.severity} className="flex items-center justify-between gap-3 rounded-md bg-canvas px-3 py-2">
                <StatusBadge label={item.severity} tone={severityTone(item.severity)} />
                <span className="font-heading text-lg font-semibold text-ink">{item.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="console-panel rounded-md p-4">
          <h2 className="font-heading text-base font-semibold text-ink">Team compliance summary</h2>
          <div className="mt-4 grid gap-2">
            {dashboard.violationsByTeam.map((team) => (
              <div key={team.team} className="grid gap-2 rounded-md bg-canvas px-3 py-2 md:grid-cols-[minmax(0,1fr)_90px_90px_110px] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{team.team}</p>
                  <p className="text-xs text-muted">{team.servicesAtRisk} services at risk</p>
                </div>
                <span className="text-xs text-muted">{team.score}% score</span>
                <span className="text-xs text-muted">{team.openViolations} open</span>
                <StatusBadge label={`${team.criticalViolations} critical`} tone={team.criticalViolations ? "danger" : "success"} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink">Top risky services</h2>
            <p className="mt-1 text-xs text-muted">Lowest scoring services by current mock compliance posture.</p>
          </div>
        </div>
        <DataTable columns={["service", "team", "score", "posture", "failed checks", "last evaluated"]} rows={riskyServiceRows} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink">Recent policy events</h2>
            <p className="mt-1 text-xs text-muted">Audit-aligned policy activity from Kyverno-style result imports and remediation state changes.</p>
          </div>
        </div>
        <DataTable columns={["time", "service", "team", "environment", "event", "result"]} rows={eventRows} />
      </section>
    </div>
  );
}
