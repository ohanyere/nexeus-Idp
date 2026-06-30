"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { EnvironmentName } from "@/lib/mock-data";
import type { KubernetesResourceKind, KubernetesResourceStatus, ServiceResourceInventory } from "@/lib/service-resources";
import { kubernetesResourceKinds } from "@/lib/service-resources";
import { Boxes, Filter, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type ServiceResourceExplorerProps = {
  inventory: ServiceResourceInventory;
};

type Filters = {
  environment: "all" | EnvironmentName;
  kind: "all" | KubernetesResourceKind;
  status: "all" | KubernetesResourceStatus;
};

const defaultFilters: Filters = {
  environment: "all",
  kind: "all",
  status: "all"
};

const environments: EnvironmentName[] = ["dev", "stage", "prod"];
const statuses: KubernetesResourceStatus[] = ["Healthy", "Progressing", "Pending", "Failed", "Unknown"];

export function ServiceResourceExplorer({ inventory }: ServiceResourceExplorerProps) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const filteredResources = useMemo(
    () => inventory.resources.filter((resource) => {
      const environmentMatch = filters.environment === "all" || resource.environment === filters.environment;
      const kindMatch = filters.kind === "all" || resource.kind === filters.kind;
      const statusMatch = filters.status === "all" || resource.status === filters.status;

      return environmentMatch && kindMatch && statusMatch;
    }),
    [filters, inventory.resources]
  );
  const groupedResources = useMemo(
    () => environments.map((environment) => ({
      environment,
      resources: filteredResources.filter((resource) => resource.environment === environment)
    })),
    [filteredResources]
  );
  const totalByStatus = useMemo(
    () => statuses.map((status) => ({
      status,
      count: inventory.resources.filter((resource) => resource.status === status).length
    })),
    [inventory.resources]
  );

  return (
    <section className="console-panel overflow-hidden rounded-md">
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <h2 className="font-heading text-base font-semibold text-ink">Service Resource Explorer</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Kubernetes resources owned by this service. Mocked now, shaped for later Kubernetes API data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="Environment"
              value={filters.environment}
              options={["all", ...environments]}
              onChange={(value) => setFilters((current) => ({ ...current, environment: value as Filters["environment"] }))}
            />
            <Select
              label="Resource Kind"
              value={filters.kind}
              options={["all", ...kubernetesResourceKinds()]}
              formatter={formatKind}
              onChange={(value) => setFilters((current) => ({ ...current, kind: value as Filters["kind"] }))}
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

      <div className="grid gap-3 border-b border-line bg-canvas px-4 py-3 md:grid-cols-5">
        {totalByStatus.map((item) => (
          <div key={item.status} className="rounded-md bg-white px-3 py-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{item.status}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4">
        {groupedResources.map((group) => (
          <section key={group.environment} className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{group.environment}</h3>
              <span className="text-xs font-medium text-muted">{group.resources.length} resources</span>
            </div>
            {group.resources.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {group.resources.map((resource) => (
                  <article key={resource.id} className="rounded-md border border-line bg-white p-3 transition hover:bg-canvas">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{formatKind(resource.kind)}</p>
                        <h4 className="mt-1 truncate text-sm font-semibold text-ink">{resource.name}</h4>
                      </div>
                      <StatusBadge label={resource.status} tone={resource.tone} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-700">{resource.summary}</p>
                    <dl className="mt-3 grid gap-2 text-[0.68rem] text-muted">
                      <Meta label="Namespace" value={resource.namespace} />
                      <Meta label="Desired" value={resource.desired ?? "N/A"} />
                      <Meta label="Current" value={resource.current ?? "N/A"} />
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState label={`No ${group.environment} resources match these filters.`} />
            )}
          </section>
        ))}
      </div>

      <div className="border-t border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">Table view</h3>
        </div>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="min-w-[980px] divide-y divide-line">
            <thead className="bg-canvas">
              <tr>
                {["environment", "kind", "name", "namespace", "status", "desired", "current", "last updated"].map((column) => (
                  <th key={column} scope="col" className="px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {filteredResources.map((resource) => (
                <tr key={`table-${resource.id}`} className="hover:bg-canvas">
                  <td className="px-3 py-2 text-xs font-semibold uppercase text-slate-700">{resource.environment}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{formatKind(resource.kind)}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-xs font-semibold text-slate-900">{resource.name}</td>
                  <td className="px-3 py-2 text-xs font-mono text-slate-700">{resource.namespace}</td>
                  <td className="px-3 py-2 text-xs"><StatusBadge label={resource.status} tone={resource.tone} /></td>
                  <td className="px-3 py-2 text-xs text-slate-700">{resource.desired ?? "N/A"}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{resource.current ?? "N/A"}</td>
                  <td className="px-3 py-2 text-xs text-muted">{resource.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
    <label className="min-w-[150px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-md border border-line bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt>{label}</dt>
      <dd className="truncate font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
      {label}
    </div>
  );
}

function formatKind(kind: string) {
  return kind.replace(/([a-z])([A-Z])/g, "$1 $2");
}
