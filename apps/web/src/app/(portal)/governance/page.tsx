import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { severityTone } from "@/lib/governance";
import { getGovernanceRuntimeSnapshot } from "@/lib/server/runtime-status";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const snapshot = await getGovernanceRuntimeSnapshot();
  const criticalAndHigh = snapshot.violations.filter((violation) => violation.severity === "critical" || violation.severity === "high").length;
  const violationsBySeverity = (["critical", "high", "medium", "low"] as const).map((severity) => ({
    severity,
    count: snapshot.violations.filter((violation) => violation.severity === severity).length
  }));
  const violationsByTeam = Array.from(new Set(snapshot.violations.map((violation) => violation.team))).map((team) => {
    const teamViolations = snapshot.violations.filter((violation) => violation.team === team);

    return {
      team,
      openViolations: teamViolations.length,
      criticalViolations: teamViolations.filter((violation) => violation.severity === "critical").length,
      servicesAtRisk: new Set(teamViolations.map((violation) => violation.serviceId)).size
    };
  });

  const riskyServiceRows = Array.from(new Set(snapshot.violations.map((violation) => violation.serviceId))).map((serviceId) => {
    const serviceViolations = snapshot.violations.filter((violation) => violation.serviceId === serviceId);
    const criticalCount = serviceViolations.filter((violation) => violation.severity === "critical").length;

    return {
    service: (
      <Link href={`/services/${serviceId}#policy`} className="font-semibold text-brand hover:underline">
        {serviceViolations[0]?.service ?? serviceId}
      </Link>
    ),
    team: serviceViolations[0]?.team ?? "Unknown",
    findings: serviceViolations.length,
    critical: criticalCount,
    "last seen": serviceViolations[0]?.lastSeenAt ?? "Unknown"
  };
  });

  const eventRows = snapshot.violations.slice(0, 8).map((violation) => ({
    time: violation.lastSeenAt,
    service: violation.service,
    team: violation.team,
    environment: violation.environment,
    event: violation.auditEvent,
    result: <StatusBadge label={violation.status} tone={violation.status === "open" || violation.status === "error" ? "danger" : "warning"} source={violation.source} />
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
        <StatCard label="PolicyReports" value={String(snapshot.policyReportCount)} detail={snapshot.source} tone={snapshot.policyReportCount ? "warning" : "neutral"} />
        <StatCard label="Active violations" value={String(snapshot.violations.length)} detail="Fail, warn, or error results" tone={snapshot.violations.length ? "warning" : "success"} />
        <StatCard label="Critical or high" value={String(criticalAndHigh)} detail="Needs platform review" tone={criticalAndHigh ? "danger" : "success"} />
        <StatCard label="Teams at risk" value={String(violationsByTeam.filter((team) => team.openViolations > 0).length)} detail="Open team findings" tone={violationsByTeam.length ? "warning" : "success"} />
      </section>

      {snapshot.warning ? <RuntimeMessage message={snapshot.warning.includes("not configured") ? "Integration not configured" : snapshot.warning} tone="warning" /> : null}
      {!snapshot.warning && snapshot.attempted && snapshot.policyReportCount === 0 ? <RuntimeMessage message="No PolicyReports found" tone="neutral" /> : null}

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
            {violationsBySeverity.map((item) => (
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
            {violationsByTeam.length ? violationsByTeam.map((team) => (
              <div key={team.team} className="grid gap-2 rounded-md bg-canvas px-3 py-2 md:grid-cols-[minmax(0,1fr)_90px_90px_110px] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{team.team}</p>
                  <p className="text-xs text-muted">{team.servicesAtRisk} services at risk</p>
                </div>
                <span className="text-xs text-muted">{team.openViolations} open</span>
                <StatusBadge label={`${team.criticalViolations} critical`} tone={team.criticalViolations ? "danger" : "success"} />
              </div>
            )) : <p className="rounded-md bg-canvas px-3 py-2 text-sm text-muted">No PolicyReports found</p>}
          </div>
        </article>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink">Top risky services</h2>
            <p className="mt-1 text-xs text-muted">Services with current Kyverno PolicyReport findings.</p>
          </div>
        </div>
        {riskyServiceRows.length ? <DataTable columns={["service", "team", "findings", "critical", "last seen"]} rows={riskyServiceRows} /> : <RuntimeMessage message="No PolicyReports found" tone="neutral" />}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink">Recent policy events</h2>
            <p className="mt-1 text-xs text-muted">Policy activity from Kyverno PolicyReport results.</p>
          </div>
        </div>
        {eventRows.length ? <DataTable columns={["time", "service", "team", "environment", "event", "result"]} rows={eventRows} /> : <RuntimeMessage message="No PolicyReports found" tone="neutral" />}
      </section>
    </div>
  );
}

function RuntimeMessage({ message, tone }: { message: string; tone: "warning" | "neutral" }) {
  const className = tone === "warning"
    ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    : "rounded-md border border-line bg-canvas px-4 py-3 text-sm text-muted";

  return <section className={className}>{message}</section>;
}
