"use client";

import type { ServiceTopologyEdge, ServiceTopologyNode } from "@/components/topology/types";
import { topologyTone } from "@/components/topology/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Box, GitBranch } from "lucide-react";

type TopologySidebarProps = {
 node?: ServiceTopologyNode;
 edges: ServiceTopologyEdge[];
 nodeNames: Map<string, string>;
};

export function TopologySidebar({ node, edges, nodeNames }: TopologySidebarProps) {
 if (!node) {
 return (
 <aside className="flex min-h-[520px] w-full flex-col border-l border-line bg-white p-4 xl:w-[320px]">
 <div className="rounded-md border border-dashed border-line bg-canvas p-4 text-sm text-slate-600">
 Select a node to inspect runtime ownership, health, and dependency details.
 </div>
 </aside>
 );
 }

 const connectedEdges = edges.filter((edge) => edge.source === node.id || edge.target === node.id);

 return (
 <aside className="flex max-h-[640px] min-h-[520px] w-full flex-col overflow-y-auto border-l border-line bg-white p-4 xl:w-[320px]">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{formatKind(node.kind)}</p>
 <h3 className="mt-1 truncate font-heading text-lg font-semibold text-ink">{node.name}</h3>
 </div>
 <StatusBadge label={healthLabel(node.health)} tone={topologyTone(node.health)} />
 </div>

 <dl className="mt-4 grid gap-3 text-xs">
 <Meta label="Owner" value={node.owner} />
 <Meta label="Environment" value={node.environment} />
 {node.language ? <Meta label="Language" value={node.language} /> : null}
 {node.runtime ? <Meta label="Runtime" value={node.runtime} /> : null}
 </dl>

 {node.description ? (
 <div className="mt-4 rounded-md bg-canvas p-3 text-xs leading-5 text-slate-700">
 {node.description}
 </div>
 ) : null}

 <div className="mt-5">
 <div className="flex items-center gap-2 text-sm font-semibold text-ink">
 <GitBranch className="h-4 w-4 text-slate-500" aria-hidden="true" />
 Connected dependencies
 </div>
 <div className="mt-3 grid gap-2">
 {connectedEdges.length ? connectedEdges.map((edge) => {
 const peerId = edge.source === node.id ? edge.target : edge.source;
 return (
 <div key={edge.id} className="rounded-md border border-line bg-white px-3 py-2 text-xs">
 <div className="flex items-center justify-between gap-2">
 <span className="font-semibold text-slate-800">{nodeNames.get(peerId) ?? peerId}</span>
 <span className="rounded-full bg-canvas px-2 py-0.5 font-medium capitalize text-slate-600">{edge.kind}</span>
 </div>
 <p className="mt-1 text-muted">{edge.label}</p>
 </div>
 );
 }) : (
 <div className="rounded-md border border-dashed border-line bg-canvas px-3 py-3 text-xs text-slate-600">
 No dependencies have been registered for this node.
 </div>
 )}
 </div>
 </div>

 <div className="mt-5">
 <div className="flex items-center gap-2 text-sm font-semibold text-ink">
 <Box className="h-4 w-4 text-slate-500" aria-hidden="true" />
 Service links
 </div>
 <div className="mt-3 flex flex-wrap gap-1.5">
 {node.connectedServices.length ? node.connectedServices.map((service) => (
 <span key={service} className="rounded-full bg-canvas px-2 py-1 text-[0.68rem] font-medium text-slate-700">
 {service}
 </span>
 )) : (
 <span className="text-xs text-muted">No service links registered.</span>
 )}
 </div>
 </div>
 </aside>
 );
}

function Meta({ label, value }: { label: string; value: string }) {
 return (
 <div>
 <dt className="font-medium uppercase tracking-[0.12em] text-muted">{label}</dt>
 <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
 </div>
 );
}

function formatKind(kind: ServiceTopologyNode["kind"]) {
 return kind.replace("-", " ");
}

function healthLabel(health: ServiceTopologyNode["health"]) {
 if (health === "healthy") {
 return "Healthy";
 }

 if (health === "warning") {
 return "Warning";
 }

 if (health === "failed") {
 return "Failed";
 }

 return "Unknown";
}
