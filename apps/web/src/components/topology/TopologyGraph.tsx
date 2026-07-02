"use client";

import { TopologyLegend } from "@/components/topology/TopologyLegend";
import { TopologyNode, type TopologyFlowNode } from "@/components/topology/TopologyNode";
import { TopologySidebar } from "@/components/topology/TopologySidebar";
import { TopologyToolbar, type TopologyFilters } from "@/components/topology/TopologyToolbar";
import type { ServiceTopology, ServiceTopologyEdge, ServiceTopologyNode, TopologyEdgeKind } from "@/components/topology/types";
import { Background, Controls, MarkerType, ReactFlow, ReactFlowProvider, type Edge, useReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

type TopologyGraphProps = {
 topology?: ServiceTopology;
 emptyMessage?: string;
};

const nodeTypes = {
 topologyNode: TopologyNode
};

const defaultFilters: TopologyFilters = {
 search: "",
 environment: "all",
 team: "all",
 health: "all",
 dependencyType: "all"
};

const edgeStyle: Record<TopologyEdgeKind, { stroke: string; dash?: string; animated?: boolean }> = {
 api: { stroke: "#57606a" },
 database: { stroke: "#2da44e" },
 queue: { stroke: "#bf8700", dash: "6 4", animated: true },
 cache: { stroke: "#8c959f", dash: "3 4" },
 storage: { stroke: "#24292f", dash: "1 5" }
};

export function TopologyGraph({ topology, emptyMessage }: TopologyGraphProps) {
 return (
 <ReactFlowProvider>
 <TopologyGraphInner topology={topology} emptyMessage={emptyMessage} />
 </ReactFlowProvider>
 );
}

function TopologyGraphInner({ topology, emptyMessage = "No runtime resources found." }: TopologyGraphProps) {
 const [filters, setFilters] = useState<TopologyFilters>(defaultFilters);
 const [selectedNodeId, setSelectedNodeId] = useState<string | null>(topology?.nodes[0]?.id ?? null);
 const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
 const { fitView } = useReactFlow();

 const teams = useMemo(() => {
 if (!topology) {
 return [];
 }

 return Array.from(new Set(topology.nodes.map((node) => node.owner))).sort();
 }, [topology]);

 const filtered = useMemo(() => {
 if (!topology) {
 return { nodes: [], edges: [] };
 }

 const search = filters.search.trim().toLowerCase();
 const candidateNodes = topology.nodes.filter((node) => {
 const matchesSearch = !search || [
 node.name,
 node.owner,
 node.environment,
 node.kind,
 node.language,
 node.runtime,
 node.description
 ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search));
 const matchesEnvironment = filters.environment === "all" || node.environment === filters.environment;
 const matchesTeam = filters.team === "all" || node.owner === filters.team;
 const matchesHealth = filters.health === "all" || node.health === filters.health;

 return matchesSearch && matchesEnvironment && matchesTeam && matchesHealth;
 });
 const visibleNodeIds = new Set(candidateNodes.map((node) => node.id));
 const candidateEdges = topology.edges.filter((edge) => {
 const matchesType = filters.dependencyType === "all" || edge.kind === filters.dependencyType;
 return matchesType && visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
 });

 if (filters.dependencyType === "all") {
 return { nodes: candidateNodes, edges: candidateEdges };
 }

 const edgeNodeIds = new Set(candidateEdges.flatMap((edge) => [edge.source, edge.target]));
 return {
 nodes: candidateNodes.filter((node) => edgeNodeIds.has(node.id)),
 edges: candidateEdges
 };
 }, [filters, topology]);

 const activeNodeId = hoveredNodeId ?? selectedNodeId;
 const connectedNodeIds = useMemo(() => {
 if (!activeNodeId) {
 return new Set<string>();
 }

 return new Set(
 filtered.edges
 .filter((edge) => edge.source === activeNodeId || edge.target === activeNodeId)
 .flatMap((edge) => [edge.source, edge.target])
 );
 }, [activeNodeId, filtered.edges]);

 const nodes = useMemo<TopologyFlowNode[]>(() => {
 return filtered.nodes.map((node) => {
 const isSelected = node.id === selectedNodeId;
 const isConnected = !activeNodeId || connectedNodeIds.size === 0 || connectedNodeIds.has(node.id);
 return {
 id: node.id,
 type: "topologyNode",
 position: node.position,
 data: {
 ...node,
 selected: isSelected,
 highlighted: Boolean(activeNodeId && connectedNodeIds.has(node.id)),
 dimmed: Boolean(activeNodeId && !isConnected)
 }
 };
 });
 }, [activeNodeId, connectedNodeIds, filtered.nodes, selectedNodeId]);

 const edges = useMemo<Edge[]>(() => {
 return filtered.edges.map((edge) => {
 const style = edgeStyle[edge.kind];
 const isActive = !activeNodeId || edge.source === activeNodeId || edge.target === activeNodeId;
 return {
 id: edge.id,
 source: edge.source,
 target: edge.target,
 label: edge.label,
 type: "smoothstep",
 animated: Boolean(style.animated && isActive),
 markerEnd: {
 type: MarkerType.ArrowClosed,
 color: style.stroke,
 width: 16,
 height: 16
 },
 style: {
 stroke: style.stroke,
 strokeWidth: isActive ? 1.8 : 1,
 strokeDasharray: style.dash,
 opacity: isActive ? 1 : 0.25
 },
 labelStyle: {
 fill: "#57606a",
 fontSize: 11,
 fontWeight: 600
 },
 labelBgStyle: {
 fill: "#ffffff",
 fillOpacity: 0.9
 }
 };
 });
 }, [activeNodeId, filtered.edges]);

 const selectedNode = useMemo(() => filtered.nodes.find((node) => node.id === selectedNodeId) ?? filtered.nodes[0], [filtered.nodes, selectedNodeId]);
 const nodeNames = useMemo(() => new Map((topology?.nodes ?? []).map((node) => [node.id, node.name])), [topology]);

 const fitGraph = useCallback(() => {
 window.requestAnimationFrame(() => fitView({ padding: 0.22, duration: 300 }));
 }, [fitView]);

 const reset = useCallback(() => {
 setFilters(defaultFilters);
 setHoveredNodeId(null);
 setSelectedNodeId(topology?.nodes[0]?.id ?? null);
 fitGraph();
 }, [fitGraph, topology]);

 if (!topology) {
 return (
 <section className="console-panel overflow-hidden rounded-md">
 <div className="border-b border-line px-4 py-3">
 <h2 className="font-heading text-base font-semibold text-ink">Service topology</h2>
 <p className="mt-1 text-xs text-muted">{emptyMessage}</p>
 </div>
 <div className="flex min-h-[360px] items-center justify-center bg-canvas px-6 text-center text-sm text-slate-600">
 {emptyMessage}
 </div>
 </section>
 );
 }

 return (
 <section className="console-panel min-w-[1120px] overflow-hidden rounded-md">
 <div className="flex flex-col gap-1 border-b border-line px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h2 className="font-heading text-base font-semibold text-ink">Interactive service topology</h2>
 <p className="mt-1 text-xs text-muted">Drag, pan, zoom, filter, and inspect dependencies for {topology.serviceName}.</p>
 </div>
 <span className="text-xs font-medium text-muted">{filtered.nodes.length} nodes · {filtered.edges.length} edges</span>
 </div>
 <TopologyToolbar filters={filters} teams={teams} onFiltersChange={setFilters} onReset={reset} onFit={fitGraph} />
 <div className="grid min-h-[560px] xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="relative min-h-[560px] bg-white">
 {nodes.length ? (
 <ReactFlow
 nodes={nodes}
 edges={edges}
 nodeTypes={nodeTypes}
 fitView
 minZoom={0.35}
 maxZoom={1.7}
 onNodeClick={(_, node) => setSelectedNodeId(node.id)}
 onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
 onNodeMouseLeave={() => setHoveredNodeId(null)}
 proOptions={{ hideAttribution: true }}
 >
 <Background color="#d0d7de" gap={24} />
 <Controls position="bottom-right" showInteractive={false} />
 </ReactFlow>
 ) : (
 <div className="flex h-full min-h-[560px] items-center justify-center px-6 text-center text-sm text-slate-600">
 No dependencies have been registered.
 </div>
 )}
 </div>
 <TopologySidebar node={selectedNode} edges={topology.edges} nodeNames={nodeNames} />
 </div>
 <TopologyLegend />
 </section>
 );
}
