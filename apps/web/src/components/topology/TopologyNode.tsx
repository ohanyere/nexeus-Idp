"use client";

import type { ServiceTopologyNode, TopologyNodeKind } from "@/components/topology/types";
import { topologyTone } from "@/components/topology/types";
import { Box, Cloud, Database, Globe2, HardDrive, Network, ServerCog, TimerReset } from "lucide-react";
import type { Node, NodeProps } from "@xyflow/react";

type TopologyNodeData = ServiceTopologyNode & {
 selected?: boolean;
 dimmed?: boolean;
 highlighted?: boolean;
};

export type TopologyFlowNode = Node<TopologyNodeData, "topologyNode">;

const nodeIcons: Record<TopologyNodeKind, typeof ServerCog> = {
 service: ServerCog,
 database: Database,
 cache: TimerReset,
 queue: Network,
 storage: HardDrive,
 "external-api": Globe2,
 "platform-service": Cloud
};

const healthClasses = {
 healthy: "bg-emerald-500",
 warning: "bg-amber-500",
 failed: "bg-red-500",
 unknown: "bg-slate-400"
};

export function TopologyNode({ data }: NodeProps<TopologyFlowNode>) {
 const Icon = nodeIcons[data.kind] ?? Box;
 const tone = topologyTone(data.health);
 const activeClass = data.selected
  ? "ring-2 ring-slate-950"
  : data.highlighted
  ? "ring-2 ring-slate-300"
  : "ring-1 ring-slate-200";

 return (
 <div
 className={[
  "w-[210px] rounded-md bg-white px-3 py-2.5 text-left shadow-panel transition",
  activeClass,
  data.dimmed ? "opacity-35" : "opacity-100"
 ].join(" ")}
 title={`${data.name} ${data.kind}`}
 >
 <div className="flex items-start gap-2.5">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
 <Icon className="h-4 w-4" aria-hidden="true" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex min-w-0 items-center justify-between gap-2">
 <p className="truncate text-sm font-semibold text-slate-950">{data.name}</p>
 <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthClasses[data.health]}`} title={healthLabel(data.health)} />
 </div>
 <p className="mt-0.5 truncate text-[0.7rem] font-medium capitalize text-slate-500">{formatKind(data.kind)}</p>
 </div>
 </div>
 <div className="mt-3 flex flex-wrap gap-1.5">
 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium text-slate-600">{data.environment}</span>
 <span className={["rounded-full px-2 py-0.5 text-[0.65rem] font-medium", toneChip(tone)].join(" ")}>{healthLabel(data.health)}</span>
 </div>
 </div>
 );
}

function formatKind(kind: TopologyNodeKind) {
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

function toneChip(tone: ReturnType<typeof topologyTone>) {
 if (tone === "success") {
 return "bg-emerald-50 text-emerald-700";
 }

 if (tone === "warning") {
 return "bg-amber-50 text-amber-700";
 }

 if (tone === "danger") {
 return "bg-red-50 text-red-700";
 }

 return "bg-slate-100 text-slate-600";
}
