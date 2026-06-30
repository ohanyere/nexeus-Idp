"use client";

import { DeploymentPromotionActions, type ReleaseActionDetail } from "@/components/DeploymentPromotionActions";
import type { StatusTone } from "@/lib/mock-data";
import {
 Activity,
 AlertTriangle,
 ChevronDown,
 ChevronRight,
 Clock3,
 ExternalLink,
 GitBranch,
 GitPullRequest,
 RotateCcw,
 Search,
 Server,
 ShieldCheck,
 SlidersHorizontal,
 X
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type EnvironmentName = "dev" | "stage" | "prod";

export type ReleaseConsoleEnvironment = {
 environment: EnvironmentName;
 sha: string;
 overlayPath: string;
 status: string;
 tone: StatusTone;
};

export type ReleaseConsolePullRequest = {
 number: number;
 title: string;
 url: string;
 head: string;
 base: string;
 state: string;
};

export type ReleaseConsoleHistoryItem = {
 from: string;
 to: string;
 version: string;
 sha: string;
 status: string;
 approvedBy: string;
 promotedAt: string;
 prUrl?: string;
 approvalStatus: string;
 mergeStatus: string;
 deployed: boolean;
 rejectedReason?: string;
};

export type ReleaseConsoleTimelineItem = {
 event: string;
 environment: string;
 time: string;
 status: string;
 tone: StatusTone;
};

export type ReleaseConsoleAuditItem = {
 actor: string;
 action: string;
 target: string;
 result: string;
 time: string;
};

export type ReleaseConsoleItem = {
 serviceId: string;
 serviceName: string;
 teamName: string;
 repositoryOwner: string;
 repositoryName: string;
 repositoryUrl: string;
 defaultBranch: string;
 environments: ReleaseConsoleEnvironment[];
 openPullRequests: ReleaseConsolePullRequest[];
 warning?: string;
 history: ReleaseConsoleHistoryItem[];
 timeline: ReleaseConsoleTimelineItem[];
 auditEvents: ReleaseConsoleAuditItem[];
 source: "catalog" | "demo";
};

type ReleaseManagementConsoleProps = {
 releases: ReleaseConsoleItem[];
 warning?: string;
};

type DrawerDetail = ReleaseActionDetail | {
 service: string;
 environment: EnvironmentName;
 reason: string;
 timestamp: string;
 details: string;
 kind: "release-state";
 prUrl?: string;
};

const environmentLabels: Record<EnvironmentName, string> = {
 dev: "Dev",
 stage: "Stage",
 prod: "Production"
};

const filterOptions = ["all", "healthy", "progressing", "failed", "rollback"] as const;
const prOptions = ["all", "open", "merged", "awaiting", "none"] as const;

export function ReleaseManagementConsole({ releases, warning }: ReleaseManagementConsoleProps) {
 const [query, setQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState<(typeof filterOptions)[number]>("all");
 const [prFilter, setPrFilter] = useState<(typeof prOptions)[number]>("all");
 const [expandedId, setExpandedId] = useState<string | null>(releases[0]?.serviceId ?? null);
 const [drawerDetail, setDrawerDetail] = useState<DrawerDetail | null>(null);

 const filteredReleases = useMemo(() => {
 const normalizedQuery = query.trim().toLowerCase();

 return releases.filter((release) => {
  const haystack = [
   release.serviceName,
   release.teamName,
   release.repositoryOwner,
   release.repositoryName,
   release.environments.map((environment) => environment.sha).join(" ")
  ].join(" ").toLowerCase();
  const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
  const matchesStatus = statusFilter === "all" || release.environments.some((environment) => enterpriseState(environment.status).key === statusFilter);
  const matchesPr = prFilter === "all" || prState(release).key === prFilter;

  return matchesQuery && matchesStatus && matchesPr;
 });
 }, [prFilter, query, releases, statusFilter]);

 const openPrs = releases.reduce((count, release) => count + release.openPullRequests.length, 0);
 const failedEnvironments = releases.reduce(
 (count, release) => count + release.environments.filter((environment) => enterpriseState(environment.status).key === "failed").length,
 0
 );
 const awaiting = releases.filter((release) => prState(release).key === "awaiting").length;

 return (
 <section className="relative min-w-[1180px] rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-900 sm:p-5 lg:p-6">
 <div className="grid gap-5">
 <header className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
 <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
 <div className="min-w-0">
 <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Release Management</p>
 <h1 className="mt-2 font-heading text-3xl font-semibold leading-tight text-slate-950">Releases</h1>
 <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Promote and rollback application releases across environments using GitOps.</p>
 </div>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
 <Metric label="Services" value={String(releases.length)} tone="neutral" />
 <Metric label="Open PRs" value={String(openPrs)} tone="info" />
 <Metric label="Awaiting" value={String(awaiting)} tone="warning" />
 <Metric label="Failed" value={String(failedEnvironments)} tone="danger" />
 </div>
 </div>
 {warning ? (
 <button
 type="button"
 onClick={() => setDrawerDetail({
  service: "Release catalog",
  environment: "dev",
  reason: "Demo data fallback active",
  timestamp: new Date().toISOString(),
  details: warning,
  kind: "release-state"
 })}
 className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
 >
 <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
 Demo fallback active · View Details
 </button>
 ) : null}
 </header>

 <section className="rounded-md border border-slate-200 bg-white p-3">
 <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto_auto] lg:items-center">
 <label className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
 <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
 <input
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 placeholder="Search services, teams, repositories, or image SHA"
 className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
 />
 </label>
 <FilterGroup label="Health" value={statusFilter} options={filterOptions} onChange={(value) => setStatusFilter(value)} />
 <FilterGroup label="PR Status" value={prFilter} options={prOptions} onChange={(value) => setPrFilter(value)} />
 </div>
 </section>

 <section className="overflow-visible rounded-md border border-slate-200 bg-white">
 <div className="hidden grid-cols-[42px_minmax(180px,1fr)_150px_minmax(170px,0.8fr)_minmax(360px,1.4fr)_150px_160px_240px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500 xl:grid">
 <span />
 <span>Service</span>
 <span>Team</span>
 <span>Repository</span>
 <span>Release Pipeline</span>
 <span>Last Update</span>
 <span>PR Status</span>
 <span className="text-right">Actions</span>
 </div>
 <div className="divide-y divide-slate-200">
 {filteredReleases.map((release) => (
 <ReleaseRow
 key={release.serviceId}
 release={release}
 expanded={expandedId === release.serviceId}
 onToggle={() => setExpandedId((current) => current === release.serviceId ? null : release.serviceId)}
 onDetails={setDrawerDetail}
 />
 ))}
 </div>
 {filteredReleases.length === 0 ? (
 <div className="px-5 py-12 text-center text-sm text-slate-500">No releases match the current search and filters.</div>
 ) : null}
 </section>
 </div>
 <DetailsDrawer detail={drawerDetail} onClose={() => setDrawerDetail(null)} />
 </section>
 );
}

function ReleaseRow({
 release,
 expanded,
 onToggle,
 onDetails
}: {
 release: ReleaseConsoleItem;
 expanded: boolean;
 onToggle: () => void;
 onDetails: (detail: DrawerDetail) => void;
}) {
 const pr = prState(release);
 const lastUpdate = release.timeline[0]?.time ?? (release.openPullRequests[0] ? `PR #${release.openPullRequests[0].number}` : "No recent event");

 return (
 <article>
 <button
 type="button"
 onClick={onToggle}
 className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 xl:grid-cols-[42px_minmax(180px,1fr)_150px_minmax(170px,0.8fr)_minmax(360px,1.4fr)_150px_160px_240px] xl:items-center xl:gap-4"
 >
 <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
 {expanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
 </span>
 <span className="min-w-0">
 <span className="block truncate text-sm font-semibold text-slate-950">{release.serviceName}</span>
 <span className="mt-1 block truncate text-xs text-slate-500">{release.serviceId}</span>
 </span>
 <span className="text-xs font-medium text-slate-700">{release.teamName}</span>
 <span className="min-w-0 text-xs font-medium text-slate-700">
 <span className="block truncate">{release.repositoryOwner}/{release.repositoryName}</span>
 <span className="mt-1 block text-slate-500">{release.defaultBranch}</span>
 </span>
 <ReleasePipeline environments={release.environments} />
 <span className="text-xs text-slate-400">{lastUpdate}</span>
 <PrStatus release={release} state={pr} />
 <span className="flex justify-start xl:justify-end" onClick={(event) => event.stopPropagation()}>
 <DeploymentPromotionActions
 service={release.serviceName}
 owner={release.repositoryOwner}
 repo={release.repositoryName}
 variant="dark"
 onDetails={onDetails}
 />
 </span>
 </button>
 {release.warning ? (
 <div className="border-t border-slate-200 bg-amber-50 px-4 py-2">
 <button
 type="button"
 onClick={() => onDetails({
  service: release.serviceName,
  environment: "stage",
  reason: "Release state unavailable",
  timestamp: new Date().toISOString(),
  details: release.warning ?? "Unable to load release state.",
  kind: "release-state"
 })}
 className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 hover:text-amber-950"
 >
 <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
 Release state unavailable · View Details
 </button>
 </div>
 ) : null}
 {expanded ? <ExpandedRelease release={release} /> : null}
 </article>
 );
}

function ReleasePipeline({ environments }: { environments: ReleaseConsoleEnvironment[] }) {
 return (
 <div className="grid gap-2 sm:grid-cols-[1fr_28px_1fr_28px_1fr] sm:items-center">
 {(["dev", "stage", "prod"] as EnvironmentName[]).map((environment, index) => {
 const releaseEnvironment = environments.find((candidate) => candidate.environment === environment);

 return (
 <div key={environment} className="contents">
 <EnvironmentNode environment={releaseEnvironment} name={environment} />
 {index < 2 ? <span className="hidden h-px bg-slate-300 sm:block" /> : null}
 </div>
 );
 })}
 </div>
 );
}

function EnvironmentNode({ environment, name }: { environment?: ReleaseConsoleEnvironment; name: EnvironmentName }) {
 const state = enterpriseState(environment?.status ?? "unknown");

 return (
 <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
 <div className="flex items-center justify-between gap-2">
 <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{environmentLabels[name]}</span>
 <EnterpriseBadge label={state.label} tone={state.tone} />
 </div>
 <p className="mt-2 truncate font-mono text-xs text-slate-800">{environment?.sha ?? "unknown"}</p>
 </div>
 );
}

function PrStatus({ release, state }: { release: ReleaseConsoleItem; state: ReturnType<typeof prState> }) {
 const openPullRequest = release.openPullRequests[0];

 if (openPullRequest) {
 return (
 <a href={openPullRequest.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:bg-slate-50" onClick={(event) => event.stopPropagation()}>
 <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
 Open PR #{openPullRequest.number}
 </a>
 );
 }

 return <EnterpriseBadge label={state.label} tone={state.tone} />;
}

function ExpandedRelease({ release }: { release: ReleaseConsoleItem }) {
 const promotionHistory = release.history.filter((event) => !event.status.toLowerCase().includes("rollback"));
 const rollbackHistory = release.history.filter((event) => event.status.toLowerCase().includes("rollback") || event.from === event.to);

 return (
 <div className="border-t border-slate-200 bg-slate-50 px-4 py-5">
 <div className="grid gap-4 2xl:grid-cols-[1.1fr_1fr_1fr]">
 <DetailPanel title="Overview" icon={<Activity className="h-4 w-4" aria-hidden="true" />}>
 <KeyValue label="Repository" value={`${release.repositoryOwner}/${release.repositoryName}`} href={release.repositoryUrl} />
 <KeyValue label="Default branch" value={release.defaultBranch} />
 <KeyValue label="Source" value={release.source === "catalog" ? "Persisted catalog" : "Demo fallback"} />
 <KeyValue label="Image SHA" value={release.environments.map((environment) => `${environment.environment}: ${environment.sha}`).join("  ")} mono />
 </DetailPanel>
 <DetailPanel title="Release Timeline" icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}>
 <TimelineList items={release.timeline} empty="No deployment events recorded." />
 </DetailPanel>
 <DetailPanel title="Recent Pull Requests" icon={<GitPullRequest className="h-4 w-4" aria-hidden="true" />}>
 {release.openPullRequests.length > 0 ? release.openPullRequests.map((pullRequest) => (
 <a key={pullRequest.number} href={pullRequest.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
 <span className="min-w-0 truncate">#{pullRequest.number} {pullRequest.title}</span>
 <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
 </a>
 )) : <EmptyLine text="No PR" />}
 </DetailPanel>
 </div>
 <div className="mt-4 grid gap-4 xl:grid-cols-2">
 <DetailPanel title="Promotion History" icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}>
 <HistoryList items={promotionHistory} empty="No promotion history recorded." />
 </DetailPanel>
 <DetailPanel title="Rollback History" icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}>
 <HistoryList items={rollbackHistory} empty="No rollback history recorded." />
 </DetailPanel>
 </div>
 <div className="mt-4 grid gap-4 xl:grid-cols-2">
 <DetailPanel title="Audit Events" icon={<GitBranch className="h-4 w-4" aria-hidden="true" />}>
 {release.auditEvents.length > 0 ? release.auditEvents.slice(0, 5).map((event) => (
 <div key={`${event.action}-${event.target}-${event.time}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="font-semibold text-slate-900">{event.action}</span>
 <EnterpriseBadge label={event.result} tone={event.result === "failed" || event.result === "blocked" ? "danger" : event.result === "pending" || event.result === "open" ? "warning" : "success"} />
 </div>
 <p className="mt-1 text-slate-500">{event.actor} · {event.time}</p>
 <p className="mt-1 text-slate-700">{event.target}</p>
 </div>
 )) : <EmptyLine text="No audit events recorded." />}
 </DetailPanel>
 <DetailPanel title="Deployment Events" icon={<Server className="h-4 w-4" aria-hidden="true" />}>
 <div className="grid gap-2">
 {release.environments.map((environment) => (
 <div key={environment.environment} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
 <div className="flex items-center justify-between gap-3">
 <span className="font-semibold text-slate-900">{environmentLabels[environment.environment]}</span>
 <EnterpriseBadge label={enterpriseState(environment.status).label} tone={enterpriseState(environment.status).tone} />
 </div>
 <p className="mt-1 break-all font-mono text-slate-600">{environment.overlayPath}</p>
 </div>
 ))}
 </div>
 </DetailPanel>
 </div>
 </div>
 );
}

function DetailsDrawer({ detail, onClose }: { detail: DrawerDetail | null; onClose: () => void }) {
 if (!detail) {
 return null;
 }

 return (
 <div className="fixed inset-0 z-40 flex justify-end overflow-x-auto bg-slate-950/40" role="dialog" aria-modal="true">
 <button type="button" className="absolute inset-0 cursor-default" aria-label="Close details drawer" onClick={onClose} />
 <aside className="relative z-10 flex h-full w-full min-w-[360px] max-w-xl flex-col border-l border-slate-200 bg-white text-slate-900 shadow-card">
 <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
 <div>
 <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Details</p>
 <h2 className="mt-1 font-heading text-xl font-semibold text-slate-950">{detail.reason}</h2>
 </div>
 <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
 <X className="h-4 w-4" aria-hidden="true" />
 </button>
 </div>
 <div className="grid gap-4 overflow-y-auto px-5 py-5">
 <DetailPanel title="Summary" icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}>
 <KeyValue label="Service" value={detail.service} />
 <KeyValue label="Environment" value={detail.environment} />
 <KeyValue label="Timestamp" value={detail.timestamp} />
 <KeyValue label="Reason" value={detail.reason} />
 </DetailPanel>
 <DetailPanel title="Stack/details" icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}>
 <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">{detail.details}</pre>
 </DetailPanel>
 <a href="/audit-logs" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-950 bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800">
 <ExternalLink className="h-4 w-4" aria-hidden="true" />
 Audit Logs
 </a>
 </div>
 </aside>
 </div>
 );
}

function FilterGroup<T extends string>({
 label,
 value,
 options,
 onChange
}: {
 label: string;
 value: T;
 options: readonly T[];
 onChange: (value: T) => void;
}) {
 return (
 <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
 <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
 {label}
 <select value={value} onChange={(event) => onChange(event.target.value as T)} className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold capitalize text-slate-900 outline-none">
 {options.map((option) => <option key={option} value={option}>{option.replace("-", " ")}</option>)}
 </select>
 </label>
 );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: EnterpriseTone }) {
 return (
 <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
 <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
 <p className={["mt-1 font-heading text-2xl font-semibold", metricText[tone]].join(" ")}>{value}</p>
 </div>
 );
}

function DetailPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
 return (
 <section className="rounded-md border border-slate-200 bg-white p-4">
 <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">{icon}{title}</h3>
 <div className="mt-3 grid gap-2">{children}</div>
 </section>
 );
}

function KeyValue({ label, value, href, mono }: { label: string; value: string; href?: string; mono?: boolean }) {
 const valueClass = mono ? "break-all font-mono text-xs text-slate-700" : "break-words text-sm text-slate-900";

 return (
 <div className="grid gap-1">
 <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
 <dd className={valueClass}>
 {href ? (
 <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-slate-950">
 {value}
 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
 </a>
 ) : value}
 </dd>
 </div>
 );
}

function TimelineList({ items, empty }: { items: ReleaseConsoleTimelineItem[]; empty: string }) {
 if (items.length === 0) {
 return <EmptyLine text={empty} />;
 }

 return (
 <div className="grid gap-2">
 {items.slice(0, 6).map((item) => (
 <div key={`${item.event}-${item.environment}-${item.time}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="font-semibold text-slate-900">{item.event}</span>
 <EnterpriseBadge label={enterpriseState(item.status).label} tone={enterpriseState(item.status).tone} />
 </div>
 <p className="mt-1 text-slate-500">{item.environment} · {item.time}</p>
 </div>
 ))}
 </div>
 );
}

function HistoryList({ items, empty }: { items: ReleaseConsoleHistoryItem[]; empty: string }) {
 if (items.length === 0) {
 return <EmptyLine text={empty} />;
 }

 return (
 <div className="grid gap-2">
 {items.slice(0, 5).map((item) => (
 <div key={`${item.from}-${item.to}-${item.sha}-${item.prUrl ?? item.status}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <span className="font-semibold text-slate-900">{item.from} {"->"} {item.to} · {item.sha}</span>
 <EnterpriseBadge label={historyLabel(item)} tone={historyTone(item)} />
 </div>
 <p className="mt-1 text-slate-500">{item.approvedBy} · {item.promotedAt}</p>
 {item.prUrl ? <a href={item.prUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />PR</a> : null}
 </div>
 ))}
 </div>
 );
}

function EmptyLine({ text }: { text: string }) {
 return <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">{text}</p>;
}

type EnterpriseTone = "success" | "info" | "warning" | "danger" | "rollback" | "neutral";
type EnterpriseStatusKey = Exclude<(typeof filterOptions)[number], "all">;

const badgeClasses: Record<EnterpriseTone, string> = {
 success: "border-emerald-200 bg-emerald-50 text-emerald-800",
 info: "border-slate-200 bg-slate-50 text-slate-800",
 warning: "border-amber-200 bg-amber-50 text-amber-800",
 danger: "border-red-200 bg-red-50 text-red-800",
 rollback: "border-purple-200 bg-purple-50 text-purple-800",
 neutral: "border-slate-200 bg-slate-50 text-slate-700"
};

const metricText: Record<EnterpriseTone, string> = {
 success: "text-emerald-800",
 info: "text-slate-900",
 warning: "text-amber-800",
 danger: "text-red-800",
 rollback: "text-purple-800",
 neutral: "text-slate-950"
};

function EnterpriseBadge({ label, tone }: { label: string; tone: EnterpriseTone }) {
 return <span className={["inline-flex items-center rounded-md border px-2 py-0.5 text-[0.68rem] font-semibold", badgeClasses[tone]].join(" ")}>{label}</span>;
}

function enterpriseState(status: string): { key: EnterpriseStatusKey; label: string; tone: EnterpriseTone } {
 const lower = status.toLowerCase();

 if (lower.includes("rollback")) {
 return { key: "rollback", label: "Rollback", tone: "rollback" };
 }

 if (lower.includes("fail") || lower.includes("blocked") || lower.includes("unknown") || lower.includes("rejected")) {
 return { key: "failed", label: "Failed", tone: "danger" };
 }

 if (lower.includes("pending") || lower.includes("approval") || lower.includes("open") || lower.includes("paused") || lower.includes("waiting")) {
 return { key: "progressing", label: lower.includes("approval") || lower.includes("pending") ? "Awaiting Approval" : "Progressing", tone: lower.includes("approval") || lower.includes("pending") ? "warning" : "info" };
 }

 if (lower.includes("deploy") || lower.includes("ready") || lower.includes("verified") || lower.includes("healthy") || lower.includes("live") || lower.includes("stable") || lower.includes("succeeded") || lower.includes("merged")) {
 return { key: "healthy", label: lower.includes("merged") ? "Merged" : "Healthy", tone: "success" };
 }

 return { key: "healthy", label: "Healthy", tone: "success" };
}

function prState(release: ReleaseConsoleItem): { key: (typeof prOptions)[number] | "awaiting"; label: string; tone: EnterpriseTone } {
 if (release.openPullRequests.length > 0) {
 return { key: "open", label: `Open PR #${release.openPullRequests[0].number}`, tone: "info" };
 }

 const latestHistory = release.history[0];

 if (latestHistory?.mergeStatus === "merged") {
 return { key: "merged", label: "Merged", tone: "success" };
 }

 if (latestHistory?.approvalStatus === "pending" || latestHistory?.mergeStatus === "open") {
 return { key: "awaiting", label: "Awaiting Approval", tone: "warning" };
 }

 return { key: "none", label: "No PR", tone: "neutral" };
}

function historyLabel(item: ReleaseConsoleHistoryItem) {
 if (item.status.toLowerCase().includes("rollback")) {
 return "Rollback";
 }

 if (item.mergeStatus === "merged") {
 return "Merged";
 }

 if (item.mergeStatus === "open" || item.approvalStatus === "pending") {
 return "Awaiting Approval";
 }

 return item.status;
}

function historyTone(item: ReleaseConsoleHistoryItem): EnterpriseTone {
 if (item.status.toLowerCase().includes("rollback")) {
 return "rollback";
 }

 if (item.mergeStatus === "merged" || item.deployed) {
 return "success";
 }

 if (item.mergeStatus === "open" || item.approvalStatus === "pending") {
 return "warning";
 }

 if (item.mergeStatus === "rejected" || item.approvalStatus === "rejected") {
 return "danger";
 }

 return "neutral";
}
