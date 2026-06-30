"use client";

import type { TopologyEdgeKind } from "@/components/topology/types";

const legendItems: Array<{ kind: TopologyEdgeKind; label: string; className: string }> = [
 { kind: "api", label: "API Call", className: "border-slate-500" },
 { kind: "database", label: "Database Connection", className: "border-emerald-600" },
 { kind: "queue", label: "Message Queue", className: "border-amber-600 border-dashed" },
 { kind: "cache", label: "Cache", className: "border-slate-400 border-dashed" },
 { kind: "storage", label: "Storage", className: "border-slate-800 border-dotted" }
];

export function TopologyLegend() {
 return (
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-canvas px-4 py-2.5 text-[0.68rem] font-medium text-slate-600">
 {legendItems.map((item) => (
 <span key={item.kind} className="inline-flex items-center gap-2">
 <span className={`h-0 w-8 border-t-2 ${item.className}`} aria-hidden="true" />
 {item.label}
 </span>
 ))}
 </div>
 );
}
