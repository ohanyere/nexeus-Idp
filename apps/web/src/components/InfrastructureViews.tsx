"use client";

import { ProvisionResourceButton } from "@/components/ProvisionResourceButton";
import { StatusBadge } from "@/components/StatusBadge";
import { provisionRequests, provisionedInfrastructureResources, resourceCatalog, resourceTemplates } from "@/lib/infrastructure";
import type { InfrastructureResourceType, InfrastructureProvider, ProvisionRequestStatus, ProvisionedResourceStatus } from "@/lib/infrastructure";
import type { EnvironmentName } from "@/lib/mock-data";
import { Database, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const all = "all";

export function ResourceCatalogView() {
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
              <StatusBadge label={resource.approvalRequired ? "Approval" : "Self-service"} tone={resource.approvalRequired ? "warning" : "success"} />
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
              <ProvisionResourceButton resourceId={resource.id} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProvisionRequestsView() {
  const [environment, setEnvironment] = useState(all);
  const [status, setStatus] = useState(all);
  const [team, setTeam] = useState(all);
  const [type, setType] = useState(all);
  const teams = unique(provisionRequests.map((request) => request.team));
  const statuses = unique(provisionRequests.map((request) => request.status));
  const types = unique(provisionRequests.map((request) => request.resourceType));
  const filtered = provisionRequests.filter((request) =>
    (environment === all || request.environment === environment) &&
    (status === all || request.status === status) &&
    (team === all || request.team === team) &&
    (type === all || request.resourceType === type)
  );

  return (
    <div className="grid gap-4">
      <FilterRow>
        <Select label="Environment" value={environment} values={["dev", "stage", "prod"]} onChange={setEnvironment} />
        <Select label="Status" value={status} values={statuses} onChange={setStatus} />
        <Select label="Team" value={team} values={teams} onChange={setTeam} />
        <Select label="Resource Type" value={type} values={types} onChange={setType} />
      </FilterRow>
      <div className="console-panel overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] divide-y divide-line">
            <thead className="bg-canvas"><tr>{["request", "requester", "approver", "environment", "resource", "submitted", "status"].map((column) => <Th key={column}>{column}</Th>)}</tr></thead>
            <tbody className="divide-y divide-line bg-white">{filtered.map((request) => (
              <tr key={request.id} className="hover:bg-canvas">
                <Td>{request.id}</Td><Td>{request.requester}</Td><Td>{request.approver}</Td><Td>{request.environment}</Td><Td>{request.resourceType} · {request.resourceName}</Td><Td>{request.submittedAt}</Td><Td><StatusBadge label={request.status} tone={request.tone} /></Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {filtered.map((request) => (
          <article key={`${request.id}-timeline`} className="console-panel rounded-md p-4">
            <h2 className="text-sm font-semibold text-ink">{request.resourceName} timeline</h2>
            <div className="mt-3 grid gap-2">
              {request.timeline.map((event) => <div key={`${request.id}-${event.event}`} className="flex items-center justify-between gap-3 rounded-md bg-canvas px-3 py-2 text-xs"><span>{event.event} · {event.actor}</span><StatusBadge label={event.status} tone={event.tone} /></div>)}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export function ProvisionedResourcesView() {
  const [environment, setEnvironment] = useState(all);
  const [status, setStatus] = useState(all);
  const [team, setTeam] = useState(all);
  const [provider, setProvider] = useState(all);
  const [type, setType] = useState(all);
  const teams = unique(provisionedInfrastructureResources.map((resource) => resource.team));
  const statuses = unique(provisionedInfrastructureResources.map((resource) => resource.status));
  const providers = unique(provisionedInfrastructureResources.map((resource) => resource.provider));
  const types = unique(provisionedInfrastructureResources.map((resource) => resource.type));
  const filtered = provisionedInfrastructureResources.filter((resource) =>
    (environment === all || resource.environment === environment) &&
    (status === all || resource.status === status) &&
    (team === all || resource.team === team) &&
    (provider === all || resource.provider === provider) &&
    (type === all || resource.type === type)
  );

  return (
    <div className="grid gap-4">
      <FilterRow>
        <Select label="Environment" value={environment} values={["dev", "stage", "prod"]} onChange={setEnvironment} />
        <Select label="Status" value={status} values={statuses} onChange={setStatus} />
        <Select label="Team" value={team} values={teams} onChange={setTeam} />
        <Select label="Provider" value={provider} values={providers} onChange={setProvider} />
        <Select label="Resource Type" value={type} values={types} onChange={setType} />
      </FilterRow>
      <div className="console-panel overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-line">
            <thead className="bg-canvas"><tr>{["name", "type", "team", "owner", "environment", "region", "provider", "status", "age", "estimated cost"].map((column) => <Th key={column}>{column}</Th>)}</tr></thead>
            <tbody className="divide-y divide-line bg-white">{filtered.map((resource) => (
              <tr key={resource.id} className="hover:bg-canvas">
                <Td><Link href={`/infrastructure/provisioned-resources/${resource.id}`} className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2">{resource.name}</Link></Td><Td>{resource.type}</Td><Td>{resource.team}</Td><Td>{resource.owner}</Td><Td>{resource.environment}</Td><Td>{resource.region}</Td><Td>{resource.provider}</Td><Td><StatusBadge label={resource.status} tone={resource.tone} /></Td><Td>{resource.age}</Td><Td>{resource.estimatedCost}</Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ResourceTemplatesView() {
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
          <div className="mt-4"><ProvisionResourceButton label="Provision from template" /></div>
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

function unique<T extends string>(items: T[]) {
  return Array.from(new Set(items));
}
