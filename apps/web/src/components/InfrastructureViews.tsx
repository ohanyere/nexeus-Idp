"use client";

import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";
import { StatusBadge } from "@/components/StatusBadge";
import { resourceCatalog, resourceTemplates } from "@/lib/infrastructure";
import type { InfrastructureResourceType } from "@/lib/infrastructure";
import type { EnvironmentName } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";
import type { RuntimeSource } from "@/lib/server/runtime-status";
import { Database, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const all = "all";

export type GitOpsProvisionRequestView = {
  id: string;
  requester: string;
  resourceType: string;
  resourceName: string;
  teamName: string;
  environment: string;
  status: string;
  gitOpsStatus: string;
  provisioningStatus: string;
  clusterStatus: string;
  gitOpsSource?: RuntimeSource;
  provisioningSource?: RuntimeSource;
  clusterSource?: RuntimeSource;
  branch?: string | null;
  commitSha?: string | null;
  prUrl?: string | null;
  prNumber?: number | null;
  prStatus?: string | null;
  mergeStatus?: string | null;
  claimPath: string;
  repositoryOwner: string;
  repositoryName: string;
  serviceName?: string | null;
  errorMessage?: string | null;
  runtimeWarnings: string[];
  createdAt: string;
  events: Array<{
    event: string;
    actor: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
};

export function ResourceCatalogView({ configuredRepositoryOwner }: { configuredRepositoryOwner?: string }) {
  const [query, setQuery] = useState("");
  const [environment, setEnvironment] = useState(all);
  const [type, setType] = useState(all);
  const [owner, setOwner] = useState(all);
  const types = unique(resourceCatalog.map((resource) => resource.type));
  const owners = unique(resourceCatalog.map((resource) => resource.owner));
  const filtered = resourceCatalog.filter((resource) => {
    const q = query.trim().toLowerCase();
    return (!q || `${resource.name} ${resource.description} ${resource.owner}`.toLowerCase().includes(q)) &&
      (environment === all || resource.supportedEnvironments.includes(environment as EnvironmentName)) &&
      (type === all || resource.type === type) &&
      (owner === all || resource.owner === owner);
  });

  return (
    <div className="grid gap-4">
      <Filters query={query} setQuery={setQuery}>
        <Select label="Environment" value={environment} values={["dev", "stage", "prod"]} onChange={setEnvironment} />
        <Select label="Resource Type" value={type} values={types} onChange={setType} />
        <Select label="Owner" value={owner} values={owners} onChange={setOwner} />
      </Filters>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((resource) => (
          <article key={resource.id} className="console-panel rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-canvas text-slate-700"><Database className="h-4 w-4" /></div>
              <StatusBadge label={resource.gitOpsResourceId ? "GitOps claim" : "Unavailable"} tone={resource.gitOpsResourceId ? "success" : "neutral"} />
            </div>
            <h2 className="mt-3 font-heading text-base font-semibold text-ink">{resource.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{resource.description}</p>
            <dl className="mt-3 grid gap-1.5 text-xs">
              <Meta label="Owner" value={resource.owner} />
              <Meta label="Cost" value={resource.estimatedMonthlyCost} />
              <Meta label="Environments" value={resource.supportedEnvironments.join(", ")} />
            </dl>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Link href={`/infrastructure/resource-catalog/${resource.id}`} className="text-xs font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2">Details</Link>
              {resource.gitOpsResourceId ? <ProvisionResourceButton resourceId={resource.id} configuredRepositoryOwner={configuredRepositoryOwner} label="Provision through GitOps" /> : <span className="text-xs font-medium text-muted">No GitOps claim</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProvisionRequestsView({ requests, warning }: { requests: GitOpsProvisionRequestView[]; warning?: string }) {
  const [environment, setEnvironment] = useState(all);
  const [status, setStatus] = useState(all);
  const [team, setTeam] = useState(all);
  const [type, setType] = useState(all);
  const teams = unique(requests.map((request) => request.teamName));
  const statuses = unique(requests.map((request) => request.status));
  const types = unique(requests.map((request) => request.resourceType));
  const filtered = requests.filter((request) =>
    (environment === all || request.environment === environment) &&
    (status === all || request.status === status) &&
    (team === all || request.teamName === team) &&
    (type === all || request.resourceType === type)
  );

  return (
    <div className="grid gap-4">
      {warning ? <StatusMessage tone="warning" message={warning} /> : null}
      <FilterRow>
        <Select label="Environment" value={environment} values={["dev", "stage", "prod"]} onChange={setEnvironment} />
        <Select label="Status" value={status} values={statuses} onChange={setStatus} />
        <Select label="Team" value={team} values={teams} onChange={setTeam} />
        <Select label="Resource Type" value={type} values={types} onChange={setType} />
      </FilterRow>
      <div className="console-panel overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] divide-y divide-line">
            <thead className="bg-canvas"><tr>{["request", "requester", "repository", "environment", "resource", "gitops", "provisioning", "cluster", "pr"].map((column) => <Th key={column}>{column}</Th>)}</tr></thead>
            <tbody className="divide-y divide-line bg-white">{filtered.map((request) => (
              <tr key={request.id} className="hover:bg-canvas">
                <Td>{request.id}</Td>
                <Td>{request.requester}</Td>
                <Td>{request.repositoryOwner}/{request.repositoryName}</Td>
                <Td>{request.environment}</Td>
                <Td>{request.resourceType} · {request.resourceName}</Td>
                <Td><StatusBadge label={request.gitOpsStatus} tone={statusTone(request.gitOpsStatus)} source={request.gitOpsSource ?? "GitHub"} /></Td>
                <Td><StatusBadge label={request.provisioningStatus} tone={statusTone(request.provisioningStatus)} source={request.provisioningSource ?? "ArgoCD"} /></Td>
                <Td><StatusBadge label={request.clusterStatus} tone={request.clusterStatus === "Not observed" ? "neutral" : statusTone(request.clusterStatus)} source={request.clusterSource ?? "Crossplane"} /></Td>
                <Td>{request.prUrl ? <a href={request.prUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">PR #{request.prNumber}</a> : "Pending"}</Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 ? <StatusMessage tone="neutral" message="No GitOps provision requests have been recorded yet." /> : null}
      <section className="grid gap-3 md:grid-cols-2">
        {filtered.map((request) => (
          <article key={`${request.id}-timeline`} className="console-panel rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">{request.resourceName} GitOps timeline</h2>
                <p className="mt-1 text-xs text-muted">{request.claimPath}</p>
              </div>
              <StatusBadge label={request.status} tone={statusTone(request.status)} />
            </div>
            <div className="mt-3 grid gap-2">
              {request.events.map((event) => <div key={`${request.id}-${event.event}-${event.createdAt}`} className="grid gap-1 rounded-md bg-canvas px-3 py-2 text-xs"><div className="flex items-center justify-between gap-3"><span>{event.event} · {event.actor}</span><StatusBadge label={event.status} tone={statusTone(event.status)} /></div><p className="text-muted">{event.message}</p></div>)}
            </div>
            {request.runtimeWarnings.length ? (
              <div className="mt-3 grid gap-2">
                {request.runtimeWarnings.map((warning) => <p key={warning} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">{warning}</p>)}
              </div>
            ) : null}
            {request.errorMessage ? <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">{request.errorMessage}</p> : null}
          </article>
        ))}
      </section>
    </div>
  );
}

export function ProvisionedResourcesView({ requests, warning }: { requests: GitOpsProvisionRequestView[]; warning?: string }) {
  const [environment, setEnvironment] = useState(all);
  const [gitOpsStatus, setGitOpsStatus] = useState(all);
  const [team, setTeam] = useState(all);
  const [type, setType] = useState(all);
  const teams = unique(requests.map((request) => request.teamName));
  const gitOpsStatuses = unique(requests.map((request) => request.gitOpsStatus));
  const types = unique(requests.map((request) => request.resourceType));
  const filtered = requests.filter((resource) =>
    (environment === all || resource.environment === environment) &&
    (gitOpsStatus === all || resource.gitOpsStatus === gitOpsStatus) &&
    (team === all || resource.teamName === team) &&
    (type === all || resource.resourceType === type)
  );

  return (
    <div className="grid gap-4">
      {warning ? <StatusMessage tone="warning" message={warning} /> : null}
      <FilterRow>
        <Select label="Environment" value={environment} values={["dev", "stage", "prod"]} onChange={setEnvironment} />
        <Select label="GitOps Status" value={gitOpsStatus} values={gitOpsStatuses} onChange={setGitOpsStatus} />
        <Select label="Team" value={team} values={teams} onChange={setTeam} />
        <Select label="Resource Type" value={type} values={types} onChange={setType} />
      </FilterRow>
      <div className="console-panel overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-line">
            <thead className="bg-canvas"><tr>{["name", "type", "team", "service", "environment", "gitops status", "provisioning status", "cluster status", "claim path"].map((column) => <Th key={column}>{column}</Th>)}</tr></thead>
            <tbody className="divide-y divide-line bg-white">{filtered.map((resource) => (
              <tr key={resource.id} className="hover:bg-canvas">
                <Td>{resource.resourceName}</Td><Td>{resource.resourceType}</Td><Td>{resource.teamName}</Td><Td>{resource.serviceName ?? "Team-level claim"}</Td><Td>{resource.environment}</Td><Td><StatusBadge label={resource.gitOpsStatus} tone={statusTone(resource.gitOpsStatus)} source={resource.gitOpsSource ?? "GitHub"} /></Td><Td><StatusBadge label={resource.provisioningStatus} tone={statusTone(resource.provisioningStatus)} source={resource.provisioningSource ?? "ArgoCD"} /></Td><Td><StatusBadge label={resource.clusterStatus} tone={resource.clusterStatus === "Not observed" ? "neutral" : statusTone(resource.clusterStatus)} source={resource.clusterSource ?? "Crossplane"} /></Td><Td>{resource.claimPath}</Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 ? <StatusMessage tone="neutral" message="No GitOps-backed infrastructure resources have been requested yet." /> : null}
    </div>
  );
}

export function ResourceTemplatesView({ configuredRepositoryOwner }: { configuredRepositoryOwner?: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {resourceTemplates.map((template) => (
        <article key={template.id} className="console-panel rounded-md p-4">
          <h2 className="font-heading text-base font-semibold text-ink">{template.name}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{template.description}</p>
          <dl className="mt-3 grid gap-1.5 text-xs">
            <Meta label="Type" value={template.resourceType} />
            <Meta label="Cost" value={template.estimatedCost} />
            <Meta label="Environments" value={template.supportedEnvironments.join(", ")} />
            <Meta label="Parameters" value={template.parameters.join(", ")} />
          </dl>
          <div className="mt-4"><ProvisionResourceButton configuredRepositoryOwner={configuredRepositoryOwner} label="Provision from template" /></div>
        </article>
      ))}
    </div>
  );
}

function Filters({ query, setQuery, children }: { query: string; setQuery: (query: string) => void; children: React.ReactNode }) {
  return <FilterRow><label className="grid gap-1.5 text-xs font-medium text-slate-800"><span>Search</span><div className="flex h-8 items-center rounded-md border border-line bg-white px-2.5"><Search className="h-3.5 w-3.5 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="ml-2 min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="resource, owner, description" /></div></label>{children}</FilterRow>;
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return <section className="console-panel rounded-md p-3"><div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">{children}</div></section>;
}

function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs font-medium text-slate-800">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 rounded-md border border-line bg-white px-2 text-xs"><option value={all}>All {label.toLowerCase()}</option>{values.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="text-right font-semibold text-slate-800">{value}</dd></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top text-xs text-slate-700">{children}</td>;
}

function StatusMessage({ message, tone }: { message: string; tone: "warning" | "neutral" }) {
  const className = tone === "warning"
    ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    : "rounded-md border border-line bg-canvas px-4 py-3 text-sm text-muted";

  return <section className={className}>{message}</section>;
}

function unique<T extends string>(items: T[]) {
  return Array.from(new Set(items));
}
