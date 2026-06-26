"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { StatusBadge } from "@/components/StatusBadge";
import { celebrateSuccess, notifySuccess, notifyWarning } from "@/lib/feedback";
import type { EnvironmentPromotion as EnvironmentPromotionModel } from "@/lib/mock-data";
import { ShieldCheck, UploadCloud } from "lucide-react";

type EnvironmentPromotionProps = {
 promotion: EnvironmentPromotionModel;
};

export function EnvironmentPromotion({ promotion }: EnvironmentPromotionProps) {
 const { can, selectedRole } = useMockSession();

 const canPromoteStage = can("deploy to stage");
 const canPromoteProd = can("deploy to prod");
 const canApproveProd = can("approve production deployment");

 function handleAction(label: string, allowed: boolean) {
 if (!allowed) {
 notifyWarning("Promotion action blocked", {
 description: `${selectedRole} is not permitted to ${label.toLowerCase()} in this mock RBAC model.`
 });
 return;
 }

 if (label === "Approve Promotion") {
 notifySuccess("Production promotion approved", {
 description: "Approval recorded as mock-only. No deployment system was called."
 });
 celebrateSuccess();
 return;
 }

 notifySuccess(`${label} recorded`, {
 description: "This remains mock-only. No deployment system was called."
 });
 }

 return (
 <section className="console-panel min-w-0 rounded-md p-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">Environment promotion</h2>
 <p className="mt-1 text-sm text-muted">Mock promotion path: dev to stage to prod with visual approval gates.</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <PromotionButton label="Promote to Stage" allowed={canPromoteStage} onClick={() => handleAction("Promote to Stage", canPromoteStage)} />
 <PromotionButton label="Promote to Production" allowed={canPromoteProd} onClick={() => handleAction("Promote to Production", canPromoteProd)} />
 <PromotionButton label="Request Approval" allowed={can("deploy to stage") || can("deploy to prod")} onClick={() => handleAction("Request Approval", can("deploy to stage") || can("deploy to prod"))} />
 <PromotionButton label="Approve Promotion" allowed={canApproveProd} onClick={() => handleAction("Approve Promotion", canApproveProd)} />
 </div>
 </div>

 <div className="mt-5 grid gap-3 lg:grid-cols-3">
 {promotion.environments.map((environment, index) => (
 <div key={environment.environment} className="rounded-md border border-line bg-white p-4 ">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{environment.environment}</p>
 <p className="mt-2 font-heading text-2xl font-semibold text-ink">{environment.version}</p>
 </div>
 <StatusBadge label={environment.status} tone={environment.tone} />
 </div>
 <dl className="mt-4 grid gap-3 text-sm">
 <div>
 <dt className="font-medium text-muted">Promotion eligibility</dt>
 <dd className="mt-1 text-slate-800">{environment.promotionEligibility}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Required approval</dt>
 <dd className="mt-1 text-slate-800">{environment.requiredApproval}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Approved by</dt>
 <dd className="mt-1 text-slate-800">{environment.approvedBy}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Promoted at</dt>
 <dd className="mt-1 text-slate-800">{environment.promotedAt}</dd>
 </div>
 </dl>
 {index < promotion.environments.length - 1 ? (
 <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
 <UploadCloud className="h-4 w-4" aria-hidden="true" />
 Promote next
 </div>
 ) : null}
 </div>
 ))}
 </div>

 <div className="mt-5">
 <h3 className="font-heading text-lg font-semibold text-ink">Promotion history</h3>
 <div className="mt-3 grid gap-2">
 {promotion.history.map((event) => (
 <div key={`${event.from}-${event.to}-${event.version}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-2 text-sm ">
 <span className="font-medium text-slate-800">{event.from} to {event.to} · {event.version}</span>
 <span className="text-muted">{event.status} · {event.approvedBy} · {event.promotedAt}</span>
 </div>
 ))}
 </div>
 </div>

 </section>
 );
}

function PromotionButton({
 label,
 allowed,
 onClick
}: {
 label: string;
 allowed: boolean;
 onClick: () => void;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-canvas"
 aria-disabled={!allowed}
 >
 <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
 {label}
 </button>
 );
}
