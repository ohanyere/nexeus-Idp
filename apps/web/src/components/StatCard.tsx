import { toneClasses } from "@/lib/status";
import type { StatusTone } from "@/lib/mock-data";

type StatCardProps = {
 label: string;
 value: string;
 detail: string;
 tone?: StatusTone;
};

export function StatCard({ label, value, detail, tone = "neutral" }: StatCardProps) {
 return (
 <div className="console-panel min-w-0 rounded-md p-4">
 <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
 <div className="mt-2 flex min-w-0 items-baseline justify-between gap-3">
 <p className="min-w-0 break-words font-heading text-2xl font-semibold leading-none text-ink">{value}</p>
 <span className={`rounded-md border px-2 py-0.5 text-[0.68rem] font-semibold ${toneClasses(tone)}`}>
 {tone}
 </span>
 </div>
 <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
 </div>
 );
}
