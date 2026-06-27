"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { StatusBadge } from "@/components/StatusBadge";
import { notifyError, notifyLoading, notifySuccess, notifyWarning } from "@/lib/feedback";
import type {
 EnvironmentPromotion as EnvironmentPromotionModel,
 PromotionApprovalStatus,
 PromotionMergeStatus,
 StatusTone
} from "@/lib/mock-data";
import { ExternalLink, GitPullRequest, Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

type EnvironmentPromotionProps = {
 promotion: EnvironmentPromotionModel;
};

type PromotionApiSuccess = {
 mode: "github";
 promotion: {
  service: string;
  sourceEnvironment: "dev" | "stage";
  targetEnvironment: "stage" | "prod";
  sha: string;
  branch: string;
  commitSha?: string;
  prUrl?: string;
  prNumber?: number;
  status: "pr_created" | "pr_open" | "unchanged" | "warning";
 };
 warning?: string;
};

type PromotionApiWarning = {
 mode: "warning";
 warning: string;
 auditEvent?: {
  status: string;
  message: string;
  prUrl?: string;
 };
};

type PromotionHistoryItem = EnvironmentPromotionModel["history"][number];
type PromotionEnvironmentItem = EnvironmentPromotionModel["environments"][number];
type TargetEnvironment = "stage" | "prod";

const statusTones: Record<string, StatusTone> = {
 pr_created: "info",
 pr_open: "warning",
 unchanged: "neutral",
 warning: "warning",
 failed: "danger"
};

function isPromotionEnvironmentItem(environment: PromotionEnvironmentItem | undefined): environment is PromotionEnvironmentItem {
 return Boolean(environment);
}

export function EnvironmentPromotion({ promotion }: EnvironmentPromotionProps) {
 const { can, selectedRole } = useMockSession();
 const [history, setHistory] = useState(promotion.history);
 const [isPromoting, setIsPromoting] = useState<TargetEnvironment | null>(null);
 const [lastWarning, setLastWarning] = useState<string | null>(null);

 const currentDev = promotion.environments.find((environment) => environment.environment === "dev");
 const currentStage = promotion.environments.find((environment) => environment.environment === "stage");
 const currentProd = promotion.environments.find((environment) => environment.environment === "prod");
 const openPullRequests = useMemo(
 () => history.filter((event) => event.mergeStatus === "open" && event.prUrl),
 [history]
 );

 async function promote(targetEnvironment: TargetEnvironment) {
 const requiredPermission = targetEnvironment === "prod" ? "deploy to prod" : "deploy to stage";

 if (!can(requiredPermission)) {
  notifyWarning("Promotion blocked", {
   description: `${selectedRole} is not permitted to promote to ${targetEnvironment}.`
  });
  return;
 }

 setIsPromoting(targetEnvironment);
 setLastWarning(null);
 const toastId = notifyLoading("Creating promotion PR", {
  description: `${promotion.serviceId} to ${targetEnvironment}.`
 });

 try {
  const response = await fetch("/api/promotions", {
   method: "POST",
   headers: {
    "Content-Type": "application/json"
   },
   body: JSON.stringify({
    service: promotion.serviceId,
    owner: promotion.repositoryOwner,
    repo: promotion.repositoryName,
    targetEnvironment,
    actor: selectedRole
   })
  });
  const payload = await response.json() as PromotionApiSuccess | PromotionApiWarning;

  if (payload.mode === "warning") {
   setLastWarning(payload.warning);
   notifyWarning("Promotion warning", {
    id: toastId,
    description: payload.warning
   });
   return;
  }

  if (payload.warning) {
   setLastWarning(payload.warning);
  }

  const promotionResult = payload.promotion;
  const approvalStatus: PromotionApprovalStatus = targetEnvironment === "prod" ? "pending" : "pending";
  const nextHistoryItem: PromotionHistoryItem = {
   from: promotionResult.sourceEnvironment,
   to: promotionResult.targetEnvironment,
   version: promotionResult.sha,
   sha: promotionResult.sha,
   status: promotionResult.status === "unchanged" ? "unchanged" : "pr created",
   approvedBy: "Pending",
   promotedAt: "Pending",
   prUrl: promotionResult.prUrl,
   approvalStatus,
   mergeStatus: promotionResult.status === "unchanged" ? "not opened" : "open",
   deployed: false
  };

  setHistory((current) => [nextHistoryItem, ...current]);
  notifySuccess("Promotion PR ready", {
   id: toastId,
   description: promotionResult.prUrl ? `Opened ${promotionResult.branch}.` : "Promotion state recorded."
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Promotion request failed.";
  setLastWarning(message);
  notifyError("Promotion request failed", {
   id: toastId,
   description: message
  });
 } finally {
  setIsPromoting(null);
 }
 }

 return (
 <section className="console-panel min-w-0 rounded-md p-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">GitOps release management</h2>
 <p className="mt-1 text-sm text-muted">{promotion.repositoryOwner}/{promotion.repositoryName}</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <PromotionButton
 label="Promote to Stage"
 targetEnvironment="stage"
 allowed={can("deploy to stage")}
 busy={isPromoting === "stage"}
 onClick={() => void promote("stage")}
 />
 <PromotionButton
 label="Promote to Production"
 targetEnvironment="prod"
 allowed={can("deploy to prod")}
 busy={isPromoting === "prod"}
 onClick={() => void promote("prod")}
 />
 {openPullRequests[0]?.prUrl ? (
 <a
 href={openPullRequests[0].prUrl}
 target="_blank"
 rel="noreferrer"
 className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-canvas"
 >
 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
 Open PR
 </a>
 ) : null}
 </div>
 </div>

 {lastWarning ? (
 <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
 {lastWarning}
 </div>
 ) : null}

 <div className="mt-5 grid gap-3 lg:grid-cols-3">
 {[currentDev, currentStage, currentProd].filter(isPromotionEnvironmentItem).map((environment) => (
 <div key={environment.environment} className="rounded-md border border-line bg-white p-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{environment.environment}</p>
 <p className="mt-2 font-heading text-xl font-semibold text-ink">{environment.sha}</p>
 </div>
 <StatusBadge label={environment.status} tone={environment.tone} />
 </div>
 <dl className="mt-4 grid gap-3 text-sm">
 <ReleaseTerm label="Version" value={environment.version} />
 <ReleaseTerm label="Approval" value={environment.requiredApproval} />
 <ReleaseTerm label="Approved by" value={environment.approvedBy} />
 <ReleaseTerm label="Deployed" value={environment.deployed ? environment.promotedAt : "Pending"} />
 </dl>
 </div>
 ))}
 </div>

 <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
 <div>
 <h3 className="font-heading text-lg font-semibold text-ink">Promotion history</h3>
 <div className="mt-3 grid gap-2">
 {history.map((event) => (
 <div key={`${event.from}-${event.to}-${event.sha}-${event.prUrl ?? event.status}`} className="rounded-md border border-line bg-white px-3 py-3 text-sm">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <span className="font-medium text-slate-800">{event.from} to {event.to} · {event.sha}</span>
 <StatusBadge label={event.status} tone={event.rejectedReason ? "danger" : statusTones[event.status] ?? "neutral"} />
 </div>
 <div className="mt-3 grid gap-2 text-xs text-muted md:grid-cols-4">
 <ReleaseTerm label="Approval status" value={event.approvalStatus} />
 <ReleaseTerm label="Merged" value={event.mergeStatus} />
 <ReleaseTerm label="Deployed" value={event.deployed ? "deployed" : "pending"} />
 <ReleaseTerm label="Approved by" value={event.approvedBy} />
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 {event.prUrl ? (
 <a
 href={event.prUrl}
 target="_blank"
 rel="noreferrer"
 className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-canvas"
 >
 <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
 View PR
 </a>
 ) : null}
 {event.rejectedReason ? (
 <span className="text-xs text-rose-700">{event.rejectedReason}</span>
 ) : null}
 </div>
 </div>
 ))}
 </div>
 </div>

 <aside>
 <h3 className="font-heading text-lg font-semibold text-ink">Release timeline</h3>
 <div className="mt-3 grid gap-2">
 {promotion.timeline.map((event) => (
 <div key={`${event.event}-${event.environment}-${event.time}`} className="rounded-md border border-line bg-white px-3 py-2">
 <div className="flex items-center justify-between gap-3">
 <span className="text-sm font-semibold text-slate-800">{event.event}</span>
 <StatusBadge label={event.status} tone={event.tone} />
 </div>
 <p className="mt-1 text-xs text-muted">{event.environment} · {event.time}</p>
 </div>
 ))}
 </div>
 </aside>
 </div>
 </section>
 );
}

function PromotionButton({
 label,
 targetEnvironment,
 allowed,
 busy,
 onClick
}: {
 label: string;
 targetEnvironment: TargetEnvironment;
 allowed: boolean;
 busy: boolean;
 onClick: () => void;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 disabled={busy}
 className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-canvas disabled:cursor-wait disabled:opacity-70"
 aria-disabled={!allowed || busy}
 data-target-environment={targetEnvironment}
 >
 {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
 {label}
 </button>
 );
}

function ReleaseTerm({ label, value }: { label: string; value: string | PromotionApprovalStatus | PromotionMergeStatus }) {
 return (
 <div>
 <dt className="font-medium text-muted">{label}</dt>
 <dd className="mt-1 break-all text-slate-800">{value}</dd>
 </div>
 );
}
