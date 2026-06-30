"use client";

import type { TopologyEdgeKind, TopologyEnvironment, TopologyHealth } from "@/components/topology/types";
import { RotateCcw, Search, ZoomIn } from "lucide-react";

export type TopologyFilters = {
 search: string;
 environment: "all" | TopologyEnvironment;
 team: "all" | string;
 health: "all" | TopologyHealth;
 dependencyType: "all" | TopologyEdgeKind;
};

type TopologyToolbarProps = {
 filters: TopologyFilters;
 teams: string[];
 onFiltersChange: (filters: TopologyFilters) => void;
 onReset: () => void;
 onFit: () => void;
};

const environmentOptions: Array<TopologyFilters["environment"]> = ["all", "dev", "stage", "prod", "shared"];
const healthOptions: Array<TopologyFilters["health"]> = ["all", "healthy", "warning", "failed", "unknown"];
const dependencyOptions: Array<TopologyFilters["dependencyType"]> = ["all", "api", "database", "queue", "cache", "storage"];

export function TopologyToolbar({ filters, teams, onFiltersChange, onReset, onFit }: TopologyToolbarProps) {
 return (
 <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_170px_150px_170px]">
 <label className="relative min-w-0" title="Search services, resources, owners, and runtimes">
 <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
 <span className="sr-only">Search topology</span>
 <input
 value={filters.search}
 onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
 placeholder="Search topology"
 className="h-8 w-full rounded-md border border-line bg-white pl-8 pr-3 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
 />
 </label>
 <Select
 label="Environment"
 value={filters.environment}
 options={environmentOptions}
 onChange={(value) => onFiltersChange({ ...filters, environment: value as TopologyFilters["environment"] })}
 />
 <Select
 label="Team"
 value={filters.team}
 options={["all", ...teams]}
 onChange={(value) => onFiltersChange({ ...filters, team: value })}
 />
 <Select
 label="Health"
 value={filters.health}
 options={healthOptions}
 onChange={(value) => onFiltersChange({ ...filters, health: value as TopologyFilters["health"] })}
 />
 <Select
 label="Dependency"
 value={filters.dependencyType}
 options={dependencyOptions}
 onChange={(value) => onFiltersChange({ ...filters, dependencyType: value as TopologyFilters["dependencyType"] })}
 />
 </div>
 <div className="flex shrink-0 items-center gap-2">
 <button
 type="button"
 onClick={onReset}
 className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-canvas"
 title="Reset filters and graph position"
 >
 <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
 Reset
 </button>
 <button
 type="button"
 onClick={onFit}
 className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
 title="Fit graph to visible area"
 >
 <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
 Fit
 </button>
 </div>
 </div>
 );
}

function Select({
 label,
 value,
 options,
 onChange
}: {
 label: string;
 value: string;
 options: string[];
 onChange: (value: string) => void;
}) {
 return (
 <label className="min-w-0" title={label}>
 <span className="sr-only">{label}</span>
 <select
 value={value}
 onChange={(event) => onChange(event.target.value)}
 className="h-8 w-full rounded-md border border-line bg-white px-2.5 text-xs font-medium capitalize text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
 >
 {options.map((option) => (
 <option key={option} value={option}>
 {option === "all" ? `All ${label.toLowerCase()}` : option}
 </option>
 ))}
 </select>
 </label>
 );
}
