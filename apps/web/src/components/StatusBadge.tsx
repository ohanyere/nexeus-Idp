import { toneClasses } from "@/lib/status";
import type { StatusTone } from "@/lib/mock-data";

type StatusBadgeProps = {
 label: string;
 tone?: StatusTone;
 source?: "GitHub" | "ArgoCD" | "Cluster" | "Crossplane" | "Kyverno" | "Seed" | "Demo" | null;
};

export function StatusBadge({ label, tone = "neutral", source }: StatusBadgeProps) {
 return (
 <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${toneClasses(tone)}`}>
 <span>{label}</span>
 {source && source !== "Demo" ? <span className="border-l border-current/20 pl-1 text-[0.62rem] font-semibold uppercase opacity-70">{source}</span> : null}
 </span>
 );
}
