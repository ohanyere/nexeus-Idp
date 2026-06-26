"use client";

import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { serviceScorecards, services } from "@/lib/mock-data";
import type { EnvironmentName } from "@/lib/mock-data";
import Link from "next/link";
import { useMemo, useState } from "react";

const allValue = "all";

export default function ScorecardsPage() {
 const [teamFilter, setTeamFilter] = useState(allValue);
 const [templateFilter, setTemplateFilter] = useState(allValue);
 const [environmentFilter, setEnvironmentFilter] = useState(allValue);

 const enriched = serviceScorecards.flatMap((scorecard) => {
 const service = services.find((item) => item.id === scorecard.serviceId);
 return service ? [{ ...scorecard, service }] : [];
 });

 const filterOptions = useMemo(() => ({
 teams: [...new Set(services.map((service) => service.team))],
 templates: [...new Set(services.map((service) => service.template))],
 environments: [...new Set(services.flatMap((service) => service.environments))]
 }), []);

 const filtered = enriched.filter((item) =>
 (teamFilter === allValue || item.service.team === teamFilter) &&
 (templateFilter === allValue || item.service.template === templateFilter) &&
 (environmentFilter === allValue || item.service.environments.includes(environmentFilter as EnvironmentName))
 );

 const averageScore = Math.round(enriched.reduce((sum, item) => sum + item.overallScore, 0) / enriched.length);
 const belowReady = enriched.filter((item) => item.maturityLevel !== "production-ready");
 const failingCounts = new Map<string, number>();
 enriched.forEach((item) => item.checks.filter((check) => !check.passed).forEach((check) => {
 failingCounts.set(check.name, (failingCounts.get(check.name) ?? 0) + 1);
 }));
 const topFailing = [...failingCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

 const rows = filtered.map((item) => ({
 service: (
 <Link href={`/services/${item.service.id}`} className="font-semibold text-brand hover:text-slate-900">
 {item.service.name}
 </Link>
 ),
 team: item.service.team,
 template: item.service.template,
 environment: item.service.environment,
 score: `${item.overallScore}%`,
 maturity: <StatusBadge label={item.maturityLevel} tone={item.maturityLevel === "production-ready" ? "success" : item.maturityLevel === "standard" ? "warning" : "danger"} />,
 passed: item.passedChecks,
 failed: item.failedChecks,
 recommendations: item.recommendations.join("; ")
 }));

 return (
 <>
 <PageHeader title="Scorecards" description="Mock production-readiness scorecards across ownership, documentation, security, observability, rollback, approval, and disaster recovery standards." />
 <section className="grid gap-4 md:grid-cols-4">
 <StatCard label="Average platform score" value={`${averageScore}%`} detail="Mock scorecard average" tone={averageScore >= 85 ? "success" : "warning"} />
 <StatCard label="Below production-ready" value={String(belowReady.length)} detail="Services needing maturity work" tone="warning" />
 <StatCard label="Checks evaluated" value="12" detail="Per service" />
 <StatCard label="Production-ready" value={String(enriched.filter((item) => item.maturityLevel === "production-ready").length)} detail="Mock mature services" tone="success" />
 </section>

 <section className="console-panel rounded-md p-5">
 <div className="grid gap-4 md:grid-cols-3">
 <FilterSelect label="Team" value={teamFilter} values={filterOptions.teams} onChange={setTeamFilter} />
 <FilterSelect label="Template" value={templateFilter} values={filterOptions.templates} onChange={setTemplateFilter} />
 <FilterSelect label="Environment" value={environmentFilter} values={filterOptions.environments} onChange={setEnvironmentFilter} />
 </div>
 </section>

 <section className="console-panel rounded-md p-5">
 <h2 className="font-heading text-lg font-semibold text-ink">Top failing standards</h2>
 <div className="mt-4 grid gap-3 md:grid-cols-4">
 {topFailing.map(([name, count]) => (
 <div key={name} className="rounded-md border border-line bg-white p-3">
 <p className="text-sm font-semibold text-slate-800">{name}</p>
 <p className="mt-1 text-sm text-muted">{count} failing services</p>
 </div>
 ))}
 </div>
 </section>

 <DataTable columns={["service", "team", "template", "environment", "score", "maturity", "passed", "failed", "recommendations"]} rows={rows} />
 </>
 );
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
 return (
 <label className="grid gap-2 text-sm font-medium text-slate-800">
 {label}
 <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none focus:border-brand">
 <option value={allValue}>All</option>
 {values.map((item) => <option key={item} value={item}>{item}</option>)}
 </select>
 </label>
 );
}
