"use client";

import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getPolicyViolationsForService,
  getServicePolicySummary,
  policyCatalog,
  policyViolations,
  postureTone,
  severityTone,
  violationStatusTone
} from "@/lib/governance";
import type { PolicySeverity, PolicyViolationStatus } from "@/lib/governance";
import type { EnvironmentName } from "@/lib/mock-data";
import Link from "next/link";
import { useMemo, useState } from "react";

const allValue = "all";

export function PolicyCatalogView() {
  const rows = policyCatalog.map((policy) => ({
    policy: (
      <div className="min-w-[220px]">
        <p className="font-semibold text-slate-900">{policy.title}</p>
        <p className="mt-1 text-xs text-muted">{policy.category}</p>
      </div>
    ),
    framework: policy.framework,
    status: <StatusBadge label={policy.status} tone={policy.status === "enabled" ? "success" : "neutral"} />,
    severity: <StatusBadge label={policy.severity} tone={severityTone(policy.severity)} />,
    mode: <StatusBadge label={policy.enforcementMode} tone={policy.enforcementMode === "enforce" ? "danger" : policy.enforcementMode === "warn" ? "warning" : "neutral"} />,
    owner: policy.owner,
    remediation: policy.remediation
  }));

  const enabledPolicies = policyCatalog.filter((policy) => policy.status === "enabled").length;
  const enforcedPolicies = policyCatalog.filter((policy) => policy.enforcementMode === "enforce").length;
  const auditPolicies = policyCatalog.filter((policy) => policy.enforcementMode === "audit").length;

  return (
    <div className="grid min-w-[1080px] gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Policies" value={String(policyCatalog.length)} detail="Modeled policy checks" />
        <StatCard label="Enabled" value={String(enabledPolicies)} detail="Active in reporting" tone="success" />
        <StatCard label="Enforced" value={String(enforcedPolicies)} detail="Blocking violations" tone="danger" />
        <StatCard label="Audit mode" value={String(auditPolicies)} detail="Visibility only" />
      </section>

      <section className="console-panel rounded-md p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <PolicyModeSummary mode="enforce" description="Stops unsafe workloads before admission." />
          <PolicyModeSummary mode="warn" description="Surfaces remediation before merge or promotion." />
          <PolicyModeSummary mode="audit" description="Records posture for governance review." />
        </div>
      </section>

      <DataTable columns={["policy", "framework", "status", "severity", "mode", "owner", "remediation"]} rows={rows} />
    </div>
  );
}

export function PolicyViolationsView() {
  const [severityFilter, setSeverityFilter] = useState(allValue);
  const [teamFilter, setTeamFilter] = useState(allValue);
  const [serviceFilter, setServiceFilter] = useState(allValue);
  const [environmentFilter, setEnvironmentFilter] = useState(allValue);
  const [statusFilter, setStatusFilter] = useState(allValue);

  const options = useMemo(() => ({
    severities: unique(policyViolations.map((violation) => violation.severity)),
    teams: unique(policyViolations.map((violation) => violation.team)),
    services: unique(policyViolations.map((violation) => violation.service)),
    environments: unique(policyViolations.map((violation) => violation.environment)),
    statuses: unique(policyViolations.map((violation) => violation.status))
  }), []);

  const filtered = policyViolations.filter((violation) =>
    (severityFilter === allValue || violation.severity === severityFilter) &&
    (teamFilter === allValue || violation.team === teamFilter) &&
    (serviceFilter === allValue || violation.service === serviceFilter) &&
    (environmentFilter === allValue || violation.environment === environmentFilter) &&
    (statusFilter === allValue || violation.status === statusFilter)
  );

  const rows = filtered.map((violation) => ({
    policy: (
      <div className="min-w-[200px]">
        <p className="font-semibold text-slate-900">{violation.category}</p>
        <p className="mt-1 text-xs text-muted">{violation.auditEvent}</p>
      </div>
    ),
    service: (
      <Link href={`/services/${violation.serviceId}#policy`} className="font-semibold text-brand hover:underline">
        {violation.service}
      </Link>
    ),
    team: violation.team,
    environment: violation.environment,
    severity: <StatusBadge label={violation.severity} tone={severityTone(violation.severity)} />,
    status: <StatusBadge label={violation.status} tone={violationStatusTone(violation.status)} />,
    resource: violation.resource,
    "last seen": violation.lastSeenAt,
    remediation: violation.remediation
  }));

  return (
    <div className="grid min-w-[1120px] gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Visible violations" value={String(filtered.length)} detail="After filters" tone={filtered.length ? "warning" : "success"} />
        <StatCard label="Critical" value={String(filtered.filter((violation) => violation.severity === "critical").length)} detail="Highest severity" tone="danger" />
        <StatCard label="Open" value={String(filtered.filter((violation) => violation.status === "open").length)} detail="Needs owner action" tone="danger" />
        <StatCard label="Resolved" value={String(filtered.filter((violation) => violation.status === "resolved").length)} detail="Closed findings" tone="success" />
      </section>

      <section className="console-panel rounded-md p-3">
        <div className="grid gap-2.5 lg:grid-cols-5">
          <FilterSelect label="Severity" value={severityFilter} values={options.severities} onChange={setSeverityFilter} />
          <FilterSelect label="Team" value={teamFilter} values={options.teams} onChange={setTeamFilter} />
          <FilterSelect label="Service" value={serviceFilter} values={options.services} onChange={setServiceFilter} />
          <FilterSelect label="Environment" value={environmentFilter} values={options.environments} onChange={setEnvironmentFilter} />
          <FilterSelect label="Status" value={statusFilter} values={options.statuses} onChange={setStatusFilter} />
        </div>
      </section>

      <DataTable columns={["policy", "service", "team", "environment", "severity", "status", "resource", "last seen", "remediation"]} rows={rows} />
    </div>
  );
}

export function ServicePolicyPanel({ serviceId }: { serviceId: string }) {
  const scorecard = getServicePolicySummary(serviceId);
  const violations = getPolicyViolationsForService(serviceId);
  const activeViolations = violations.filter((violation) => violation.status !== "resolved");
  const passingCount = scorecard?.passingPolicies ?? policyCatalog.length - activeViolations.length;
  const evaluatedCount = scorecard?.evaluatedPolicies ?? policyCatalog.length;

  const rows = violations.map((violation) => ({
    category: violation.category,
    environment: violation.environment,
    severity: <StatusBadge label={violation.severity} tone={severityTone(violation.severity)} />,
    status: <StatusBadge label={violation.status} tone={violationStatusTone(violation.status)} />,
    resource: violation.resource,
    remediation: violation.remediation
  }));

  return (
    <article className="console-panel rounded-md p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">Policy</h2>
          <p className="mt-1 text-sm text-muted">Kyverno-style policy posture, remediation guidance, and audit events for this service.</p>
        </div>
        <StatusBadge label={scorecard ? `${scorecard.score}% · ${scorecard.posture}` : "unknown"} tone={scorecard ? postureTone(scorecard.posture) : "neutral"} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <PolicyMetric label="Evaluated" value={String(evaluatedCount)} detail="Policy checks" />
        <PolicyMetric label="Passing" value={String(passingCount)} detail="Compliant checks" tone="success" />
        <PolicyMetric label="Open" value={String(activeViolations.length)} detail="Active findings" tone={activeViolations.length ? "warning" : "success"} />
        <PolicyMetric label="Critical" value={String(activeViolations.filter((violation) => violation.severity === "critical").length)} detail="Needs immediate review" tone="danger" />
      </div>

      {scorecard ? (
        <p className="mt-3 text-xs text-muted">Last evaluated {scorecard.lastEvaluatedAt}. Results are typed mock data shaped for future Kyverno or OPA report ingestion.</p>
      ) : (
        <p className="mt-3 text-xs text-muted">No service-specific governance mock exists yet. Future Kyverno or OPA imports can populate this section.</p>
      )}

      <div className="mt-5">
        {rows.length ? (
          <DataTable columns={["category", "environment", "severity", "status", "resource", "remediation"]} rows={rows} />
        ) : (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            No active policy violations are recorded for this service.
          </div>
        )}
      </div>
    </article>
  );
}

export function ServicePolicyCompactStatus({ serviceId }: { serviceId: string }) {
  const scorecard = getServicePolicySummary(serviceId);

  if (!scorecard) {
    return <StatusBadge label="policy unknown" tone="neutral" />;
  }

  return <StatusBadge label={`${scorecard.score}% policy`} tone={postureTone(scorecard.posture)} />;
}

function PolicyModeSummary({ mode, description }: { mode: "audit" | "warn" | "enforce"; description: string }) {
  const count = policyCatalog.filter((policy) => policy.enforcementMode === mode).length;

  return (
    <div className="rounded-md bg-canvas p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold capitalize text-slate-900">{mode}</p>
        <StatusBadge label={String(count)} tone={mode === "enforce" ? "danger" : mode === "warn" ? "warning" : "neutral"} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

function PolicyMetric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  return (
    <div className="rounded-md bg-canvas p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
      <div className="mt-2">
        <StatusBadge label={tone} tone={tone} />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange
}: {
  label: string;
  value: string;
  values: Array<string | PolicySeverity | PolicyViolationStatus | EnvironmentName>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-800">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 rounded-md border border-line bg-white px-2.5 text-xs text-ink outline-none focus:border-brand">
        <option value={allValue}>All</option>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

function unique<T extends string>(items: T[]) {
  return [...new Set(items)];
}
