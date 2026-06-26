import { toneClasses } from "@/lib/status";
import type { StatusTone } from "@/lib/mock-data";

type StatusBadgeProps = {
 label: string;
 tone?: StatusTone;
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
 return (
 <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${toneClasses(tone)}`}>
 {label}
 </span>
 );
}
