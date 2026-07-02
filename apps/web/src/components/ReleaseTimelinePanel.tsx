"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { EnvironmentName } from "@/lib/mock-data";
import type { ReleaseEventStatus, ReleaseEventType, ReleaseLogGroup, ReleaseLogSource, ReleaseTimelineEvent } from "@/lib/release-timeline";
import { releaseEventTypeLabel, releaseLogSourceLabel } from "@/lib/release-timeline";
import { GitPullRequest, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type ReleaseTimelinePanelProps = {
 title?: string;
 description?: string;
 events: ReleaseTimelineEvent[];
 logs: ReleaseLogGroup[];
 compact?: boolean;
};

type Filters = {
 environment: "all" | EnvironmentName;
 eventType: "all" | ReleaseEventType;
 status: "all" | ReleaseEventStatus;
};

const defaultFilters: Filters = {
 environment: "all",
 eventType: "all",
 status: "all"
};

const eventTypes: ReleaseEventType[] = ["commit", "ci", "test", "image", "gitops", "pr", "argocd", "rollout", "provisioning", "policy", "audit", "rollback"];
const statuses: ReleaseEventStatus[] = ["succeeded", "running", "waiting", "failed", "warning", "blocked", "requested"];

export function ReleaseTimelinePanel({
 title = "Release Timeline",
 description = "End-to-end release activity from code change to deployment.",
 events,
 logs,
 compact = false
}: ReleaseTimelinePanelProps) {
 const [filters, setFilters] = useState<Filters>(defaultFilters);
 const environments = useMemo(() => Array.from(new Set(events.map((event) => event.environment))).sort(), [events]);
 const filteredEvents = useMemo(
 () => events.filter((event) => {
 const environmentMatch = filters.environment === "all" || event.environment === filters.environment;
 const eventTypeMatch = filters.eventType === "all" || event.type === filters.eventType;
 const statusMatch = filters.status === "all" || event.status === filters.status;

 return environmentMatch && eventTypeMatch && statusMatch;
 }),
 [events, filters]
 );
 const filteredLogs = useMemo(
 () => logs.filter((log) => {
 const environmentMatch = filters.environment === "all" || log.environment === filters.environment;
 const statusMatch = filters.status === "all" || log.status === filters.status;
 const typeMatch = filters.eventType === "all" || logSourceMatchesEventType(log.source, filters.eventType);

 return environmentMatch && statusMatch && typeMatch;
 }),
 [filters, logs]
 );

 return (
 <section className="console-panel overflow-hidden rounded-md">
 <div className="border-b border-line px-4 py-3">
 <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
 <p className="mt-1 text-xs text-muted">{description}</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Select
 label="Environment"
 value={filters.environment}
 options={["all", ...environments]}
 onChange={(value) => setFilters((current) => ({ ...current, environment: value as Filters["environment"] }))}
 />
 <Select
 label="Event Type"
 value={filters.eventType}
 options={["all", ...eventTypes]}
 formatter={(value) => releaseEventTypeLabel(value as ReleaseEventType)}
 onChange={(value) => setFilters((current) => ({ ...current, eventType: value as Filters["eventType"] }))}
 />
 <Select
 label="Status"
 value={filters.status}
 options={["all", ...statuses]}
 onChange={(value) => setFilters((current) => ({ ...current, status: value as Filters["status"] }))}
 />
 <button
 type="button"
 onClick={() => setFilters(defaultFilters)}
 className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-canvas"
 >
 <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
 Reset
 </button>
 </div>
 </div>
 </div>

 <div className={`grid gap-0 ${compact ? "" : "xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]"}`}>
 <div className="min-w-0 border-b border-line bg-white p-4 xl:border-b-0 xl:border-r">
 <div className="mb-3 flex items-center justify-between gap-3">
 <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Events</p>
 <span className="text-xs font-medium text-muted">{filteredEvents.length} shown</span>
 </div>
 <div className="grid gap-3">
 {filteredEvents.length ? filteredEvents.map((event) => (
 <TimelineEventItem key={event.id} event={event} />
 )) : (
 <EmptyState label="No release events match these filters." />
 )}
 </div>
 </div>

 <div className="min-w-0 bg-canvas p-4">
 <div className="mb-3 flex items-center justify-between gap-3">
 <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Deployment Logs</p>
 <span className="text-xs font-medium text-muted">{filteredLogs.length} groups</span>
 </div>
 <div className="grid gap-3">
 {filteredLogs.length ? filteredLogs.map((log) => (
 <LogGroup key={log.id} log={log} />
 )) : (
 <EmptyState label="No deployment logs match these filters." />
 )}
 </div>
 </div>
 </div>
 </section>
 );
}

function TimelineEventItem({ event }: { event: ReleaseTimelineEvent }) {
 return (
 <article className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
 <div className="pt-1">
 <span className={`block h-2.5 w-2.5 rounded-full ${dotClass(event.tone)}`} />
 </div>
 <div className="min-w-0 rounded-md bg-white px-3 py-2 transition hover:bg-canvas">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex min-w-0 items-center gap-2">
 <span className="rounded-full bg-canvas px-2 py-0.5 text-[0.68rem] font-semibold uppercase text-slate-600">{event.environment}</span>
 <p className="truncate text-sm font-semibold text-ink">{event.label}</p>
 </div>
 <StatusBadge label={event.status} tone={event.tone} source={eventSource(event.source)} />
 </div>
 <p className="mt-1 text-xs leading-5 text-slate-700">{event.detail}</p>
 <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-medium text-muted">
 <span>{event.time}</span>
 <span>{releaseEventTypeLabel(event.type)}</span>
 <span>{event.source}</span>
 <span>{event.release}</span>
 {event.commit ? <span className="font-mono">{event.commit}</span> : null}
 {event.prUrl ? (
 <a href={event.prUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-slate-950">
 <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
 PR
 </a>
 ) : null}
 </div>
 </div>
 </article>
 );
}

function LogGroup({ log }: { log: ReleaseLogGroup }) {
 return (
 <article className="overflow-hidden rounded-md border border-line bg-white">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
 <div>
 <h3 className="text-sm font-semibold text-ink">{log.title}</h3>
 <p className="mt-0.5 text-[0.68rem] font-medium text-muted">{releaseLogSourceLabel(log.source)} · {log.environment} · {log.release}</p>
 </div>
 <StatusBadge label={log.status} tone={log.tone} source={log.source === "github-actions" ? "GitHub" : log.source === "argocd" ? "ArgoCD" : "Cluster"} />
 </div>
 <div className="max-h-56 overflow-auto bg-slate-950 p-3 font-mono text-[0.7rem] leading-5 text-slate-100">
 {log.lines.map((line, index) => (
 <p key={`${log.id}-${index}`}><span className="text-slate-500">$</span> {line}</p>
 ))}
 </div>
 </article>
 );
}

function Select({
 label,
 value,
 options,
 formatter,
 onChange
}: {
 label: string;
 value: string;
 options: string[];
 formatter?: (value: string) => string;
 onChange: (value: string) => void;
}) {
 return (
 <label className="min-w-[140px]">
 <span className="sr-only">{label}</span>
 <select
 value={value}
 onChange={(event) => onChange(event.target.value)}
 className="h-8 w-full rounded-md border border-line bg-white px-2.5 text-xs font-medium capitalize text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
 title={label}
 >
 {options.map((option) => (
 <option key={option} value={option}>
 {option === "all" ? `All ${label.toLowerCase()}` : formatter ? formatter(option) : option}
 </option>
 ))}
 </select>
 </label>
 );
}

function EmptyState({ label }: { label: string }) {
 return (
 <div className="rounded-md border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-muted">
 {label}
 </div>
 );
}

function logSourceMatchesEventType(source: ReleaseLogSource, type: ReleaseEventType) {
 if (source === "github-actions") {
 return ["commit", "ci", "test", "image"].includes(type);
 }

 if (source === "argocd") {
 return ["gitops", "pr", "argocd"].includes(type);
 }

 return ["rollout", "rollback", "provisioning", "policy", "audit"].includes(type);
}

function eventSource(source: ReleaseTimelineEvent["source"]) {
 if (source === "Argo Rollouts" || source === "Rollback") {
 return "Cluster";
 }

 if (source === "GitOps") {
 return "ArgoCD";
 }

 if (source === "Audit") {
 return "Seed";
 }

 return source;
}

function dotClass(tone: ReleaseTimelineEvent["tone"]) {
 if (tone === "success") {
 return "bg-emerald-600";
 }

 if (tone === "danger") {
 return "bg-red-600";
 }

 if (tone === "warning") {
 return "bg-amber-600";
 }

 if (tone === "drift") {
 return "bg-violet-600";
 }

 if (tone === "info") {
 return "bg-slate-500";
 }

 return "bg-slate-300";
}
