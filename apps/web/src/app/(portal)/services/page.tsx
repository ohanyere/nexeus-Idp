"use client";

import { PageHeader } from "@/components/PageHeader";
import { useMockSession } from "@/components/MockSessionContext";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getServiceResources, services as mockServices } from "@/lib/mock-data";
import type { EnvironmentName, Service, StatusTone } from "@/lib/mock-data";
import { statusTone } from "@/lib/status";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const allValue = "all";

type CatalogApiService = {
 id: string;
 name: string;
 description: string;
 repositoryUrl: string;
 repositoryName: string;
 template: string;
 ownerEmail: string;
 estimatedMonthlyCost: number;
 healthStatus: string;
 deploymentStatus: string;
 team: {
 id: string;
 name: string;
 slug: string;
 };
 environments: Array<{
 name: string;
 currentVersion: string;
 status: string;
 }>;
 capabilities: Array<{
 name: string;
 }>;
 currentVersion: string;
};

function toneFromStatus(value: string): StatusTone {
 return statusTone(value);
}

function toServiceListItem(service: CatalogApiService): Service {
 const environments = service.environments.map((environment) => environment.name as EnvironmentName);

 return {
 id: service.name,
 name: service.name,
 teamId: service.team.slug,
 team: service.team.name,
 serviceOwner: service.ownerEmail,
 ownerEmail: service.ownerEmail,
 template: service.template,
 environment: environments[0] ?? "dev",
 environments,
 healthStatus: service.healthStatus,
 healthTone: toneFromStatus(service.healthStatus),
 deploymentStatus: service.deploymentStatus,
 deploymentTone: toneFromStatus(service.deploymentStatus),
 currentVersion: service.currentVersion,
 monthlyCost: `$${service.estimatedMonthlyCost.toLocaleString()}`,
 description: service.description,
 repository: service.repositoryUrl,
 documentation: {
 repository: service.repositoryUrl,
 runbook: "Runbook link",
 apiDocs: "API documentation link",
 eventDocs: "Event documentation link",
 owner: service.ownerEmail
 },
 platformContacts: ["platform-oncall@example.com"],
 escalationContacts: [service.ownerEmail],
 dependencies: []
 };
}

export default function ServicesPage() {
 const { can } = useMockSession();
 const [query, setQuery] = useState("");
 const [teamFilter, setTeamFilter] = useState(allValue);
 const [environmentFilter, setEnvironmentFilter] = useState(allValue);
 const [templateFilter, setTemplateFilter] = useState(allValue);
 const [healthFilter, setHealthFilter] = useState(allValue);
 const [persistedServices, setPersistedServices] = useState<Service[]>([]);
 const [catalogSource, setCatalogSource] = useState<"loading" | "database" | "mock">("loading");

 useEffect(() => {
 let active = true;

 async function loadServices() {
 try {
 const response = await fetch("/api/services", { cache: "no-store" });

 if (!response.ok) {
 throw new Error("Catalog API unavailable.");
 }

 const result = await response.json();
 const databaseServices = Array.isArray(result.services) ? result.services.map(toServiceListItem) : [];

 if (!active) {
 return;
 }

 if (databaseServices.length > 0) {
 setPersistedServices(databaseServices);
 setCatalogSource("database");
 } else {
 setCatalogSource("mock");
 }
 } catch {
 if (active) {
 setCatalogSource("mock");
 }
 }
 }

 loadServices();

 return () => {
 active = false;
 };
 }, []);

 const activeServices = catalogSource === "database" ? persistedServices : mockServices;

 const filterOptions = useMemo(() => ({
 teams: [...new Set(activeServices.map((service) => service.team))],
 environments: [...new Set(activeServices.flatMap((service) => service.environments))],
 templates: [...new Set(activeServices.map((service) => service.template))],
 health: [...new Set(activeServices.map((service) => service.healthStatus))]
 }), [activeServices]);

 const filteredServices = activeServices.filter((service) => {
 const normalizedQuery = query.trim().toLowerCase();
 const matchesQuery = !normalizedQuery ||
 service.name.toLowerCase().includes(normalizedQuery) ||
 service.description.toLowerCase().includes(normalizedQuery) ||
 service.team.toLowerCase().includes(normalizedQuery);

 return matchesQuery &&
 (teamFilter === allValue || service.team === teamFilter) &&
 (environmentFilter === allValue || service.environments.includes(environmentFilter as "dev" | "stage" | "prod")) &&
 (templateFilter === allValue || service.template === templateFilter) &&
 (healthFilter === allValue || service.healthStatus === healthFilter);
 });

 return (
 <div className="grid min-w-[1080px] max-w-none gap-5">
 <PageHeader
 title="Services"
 description="Catalog records with ownership, runtime posture, deployment state, dependencies, and resource relationships."
 action={
 can("create service") ? (
 <Link
 href="/services/create"
 className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-950 bg-slate-950 px-2.5 text-xs font-semibold text-white hover:bg-slate-800"
 >
 <Plus className="h-3.5 w-3.5" aria-hidden="true" />
 Create Service
 </Link>
 ) : null
 }
 />

 <section className="grid gap-3 md:grid-cols-4">
 <StatCard label="Services" value={String(activeServices.length)} detail="Catalog records" />
 <StatCard label="Visible" value={String(filteredServices.length)} detail="After filters" />
 <StatCard label="Production" value={String(activeServices.filter((service) => service.environments.includes("prod")).length)} detail="Prod coverage" />
 <StatCard label="Needs review" value={String(activeServices.filter((service) => service.healthTone !== "success").length)} detail="Health or drift" tone="warning" />
 </section>

 {catalogSource === "mock" && process.env.NODE_ENV === "development" ? (
 <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
 Showing reference catalog data because the database is not configured, unavailable, or empty.
 </section>
 ) : null}

 <section className="console-panel rounded-md p-3">
 <div className="grid gap-2.5 lg:grid-cols-[minmax(240px,1.3fr)_repeat(4,minmax(130px,1fr))]">
 <label className="grid gap-1.5 text-xs font-medium text-slate-800">
 Search catalog
 <div className="flex h-8 items-center rounded-md border border-line bg-white px-2.5 focus-within:border-brand">
 <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
 <input
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 placeholder="service, team, description"
 className="ml-2 min-w-0 flex-1 border-0 bg-transparent text-xs text-ink outline-none"
 />
 </div>
 </label>
 <FilterSelect label="Team" value={teamFilter} values={filterOptions.teams} onChange={setTeamFilter} />
 <FilterSelect label="Environment" value={environmentFilter} values={filterOptions.environments} onChange={setEnvironmentFilter} />
 <FilterSelect label="Template" value={templateFilter} values={filterOptions.templates} onChange={setTemplateFilter} />
 <FilterSelect label="Health" value={healthFilter} values={filterOptions.health} onChange={setHealthFilter} />
 </div>
 </section>

 <section className="console-panel overflow-visible rounded-md">
 <div className="border-b border-line px-4 py-2.5">
 <h2 className="font-heading text-base font-semibold text-ink">Service catalog</h2>
 <p className="mt-1 text-xs text-muted">Dense summary records; open a service for topology, deployments, resources, and scorecards.</p>
 </div>
 <div className="min-w-[1040px] divide-y divide-line">
 {filteredServices.map((service) => {
 const resources = getServiceResources(service.id);

 return (
 <article key={service.id} className="grid gap-2.5 px-4 py-2.5 transition hover:bg-slate-50 xl:grid-cols-[minmax(0,1.5fr)_180px_210px_180px] xl:items-center">
 <div className="min-w-0">
 <Link href={`/services/${service.id}`} className="font-heading text-[0.95rem] font-semibold text-slate-950 hover:underline">
 {service.name}
 </Link>
 <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{service.description}</p>
 </div>
 <div className="grid min-w-0 gap-1 text-xs">
 <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{service.team}</span>
 <span className="truncate text-slate-500">{service.serviceOwner}</span>
 </div>
 <div className="grid gap-2 text-xs">
 <div className="flex flex-wrap gap-2">
 <StatusBadge label={service.healthStatus} tone={service.healthTone} />
 <StatusBadge label={service.deploymentStatus} tone={service.deploymentTone} />
 </div>
 <p className="text-muted">{service.template} · {service.currentVersion}</p>
 </div>
 <div className="flex flex-wrap gap-1.5 text-xs">
 <Meta label="envs" value={service.environments.join("/")} />
 <Meta label="deps" value={String(service.dependencies.length)} />
 <Meta label="resources" value={String(resources.length)} />
 </div>
 </article>
 );
 })}
 </div>
 </section>
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
 values: string[];
 onChange: (value: string) => void;
}) {
 return (
 <label className="grid gap-1.5 text-xs font-medium text-slate-800">
 {label}
 <select
 value={value}
 onChange={(event) => onChange(event.target.value)}
 className="h-8 rounded-md border border-line bg-white px-2.5 text-xs text-ink outline-none focus:border-brand"
 >
 <option value={allValue}>All</option>
 {values.map((item) => (
 <option key={item} value={item}>{item}</option>
 ))}
 </select>
 </label>
 );
}

function Meta({ label, value }: { label: string; value: string }) {
 return (
 <span className="inline-flex h-6 items-center gap-1 rounded-full bg-slate-100 px-2 text-[0.68rem] font-medium text-slate-700">
 <span className="uppercase tracking-[0.1em] text-slate-500">{label}</span>
 <span className="font-semibold text-slate-900">{value}</span>
 </span>
 );
}
