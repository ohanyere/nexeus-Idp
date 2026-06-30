"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { Service, StatusTone } from "@/lib/mock-data";

type TopologyFlowProps = {
 services: Service[];
 title?: string;
 height?: string;
};

const toneBorder: Record<StatusTone, string> = {
 success: "#2da44e",
 warning: "#bf8700",
 danger: "#cf222e",
 info: "#57606a",
 drift: "#8250df",
 neutral: "#8c959f"
};

export function TopologyFlow({ services, title = "Platform topology", height = "420px" }: TopologyFlowProps) {
 const nodes: Node[] = [];
 const edges: Edge[] = [];
 const resourceIndex = new Map<string, number>();

 services.forEach((service, serviceIndex) => {
 const serviceNodeId = `service-${service.id}`;
 const x = 40 + (serviceIndex % 3) * 290;
 const y = 42 + Math.floor(serviceIndex / 3) * 168;

 nodes.push({
 id: serviceNodeId,
 position: { x, y },
 data: {
 label: (
 <NodeCard
 title={service.name}
 detail={`${service.team} · ${service.environment} · ${service.currentVersion}`}
 kind="service"
 tone={service.healthTone}
 />
 )
 },
 style: { border: "none", background: "transparent", width: 235 }
 });

 service.dependencies.forEach((dependency, dependencyIndex) => {
 const normalizedName = dependency.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
 const resourceNodeId = `dependency-${normalizedName}`;

 if (!resourceIndex.has(resourceNodeId)) {
 resourceIndex.set(resourceNodeId, resourceIndex.size);
 const row = resourceIndex.size - 1;
 nodes.push({
 id: resourceNodeId,
 position: {
 x: 110 + (row % 4) * 225,
 y: 360 + Math.floor(row / 4) * 128
 },
 data: {
 label: (
 <NodeCard
 title={dependency.name}
 detail={`${dependency.type} · ${dependency.environment}`}
 kind={dependency.type}
 tone={dependency.tone}
 />
 )
 },
 style: { border: "none", background: "transparent", width: 205 }
 });
 }

 edges.push({
 id: `${serviceNodeId}-${resourceNodeId}-${dependencyIndex}`,
 source: serviceNodeId,
 target: resourceNodeId,
 type: "smoothstep",
 style: { stroke: "#8c959f", strokeWidth: 1.2 },
 animated: dependency.tone === "warning" || dependency.tone === "drift" || dependency.tone === "danger"
 });
 });
 });

 return (
 <section className="console-panel min-w-0 overflow-hidden rounded-md">
 <div className="flex items-center justify-between border-b border-line px-4 py-3">
 <div>
 <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
 <p className="mt-1 text-xs text-muted">Services, runtime resources, and external dependencies.</p>
 </div>
 <span className="text-xs font-medium text-muted">{nodes.length} nodes · {edges.length} edges</span>
 </div>
 <div className="min-w-0 bg-white" style={{ height }}>
 <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} nodesDraggable={false}>
 <Background color="#d0d7de" gap={20} />
 <Controls position="bottom-right" showInteractive={false} />
 </ReactFlow>
 </div>
 </section>
 );
}

function NodeCard({
 title,
 detail,
 kind,
 tone
}: {
 title: string;
 detail: string;
 kind: string;
 tone: StatusTone;
}) {
 return (
 <div className="rounded-md border bg-white px-3 py-2 text-left " style={{ borderColor: toneBorder[tone] }}>
 <div className="flex items-center justify-between gap-3">
 <p className="truncate text-xs font-semibold text-slate-900">{title}</p>
 <span className="h-2 w-2 shrink-0 rounded-md" style={{ background: toneBorder[tone] }} />
 </div>
 <p className="mt-1 truncate text-[0.68rem] text-slate-500">{detail}</p>
 <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-400">{kind}</p>
 </div>
 );
}
