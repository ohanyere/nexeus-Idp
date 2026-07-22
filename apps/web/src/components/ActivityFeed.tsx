import { toneClasses } from "@/lib/status";
import type { StatusTone } from "@/lib/mock-data";

type ActivityFeedItem = {
 title: string;
 detail: string;
 time: string;
 tone?: StatusTone;
};

type ActivityFeedProps = {
 items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
 return (
 <section className="console-panel min-w-0 overflow-hidden rounded-md">
 <div className="border-b border-line px-4 py-3">
 <h2 className="font-heading text-base font-semibold text-ink">Activity feed</h2>
 <p className="mt-1 text-xs text-muted">Recent platform events across the tenant.</p>
 </div>
 <div className="divide-y divide-line">
 {items.map((item) => (
 <article key={`${item.title}-${item.time}`} className="flex gap-3 px-4 py-3 hover:bg-canvas">
 <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-md border ${toneClasses(item.tone)}`} />
 <div className="min-w-0 flex-1">
 <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
 <h3 className="text-xs font-semibold capitalize text-ink">{item.title}</h3>
 <p className="text-xs text-muted">{item.time}</p>
 </div>
 <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
 </div>
 </article>
 ))}
 </div>
 </section>
 );
}
