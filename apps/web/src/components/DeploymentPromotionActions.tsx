"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { notifyError, notifyLoading, notifySuccess, notifyWarning } from "@/lib/feedback";
import { ExternalLink, GitPullRequest, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

type TargetEnvironment = "stage" | "prod";

type DeploymentPromotionActionsProps = {
 service: string;
 owner: string;
 repo: string;
};

type PromotionApiSuccess = {
 mode: "github";
 promotion: {
  targetEnvironment: TargetEnvironment;
  branch: string;
  prUrl?: string;
  status: "pr_created" | "pr_open" | "unchanged" | "warning";
 };
 warning?: string;
};

type PromotionApiWarning = {
 mode: "warning";
 warning: string;
 auditEvent?: {
  prUrl?: string;
 };
};

export function DeploymentPromotionActions({ service, owner, repo }: DeploymentPromotionActionsProps) {
 const { can, selectedRole } = useMockSession();
 const [busyTarget, setBusyTarget] = useState<TargetEnvironment | null>(null);
 const [lastPrUrl, setLastPrUrl] = useState<string | null>(null);
 const [lastWarning, setLastWarning] = useState<string | null>(null);

 async function promote(targetEnvironment: TargetEnvironment) {
 const requiredPermission = targetEnvironment === "prod" ? "deploy to prod" : "deploy to stage";

 if (!can(requiredPermission)) {
  notifyWarning("Promotion blocked", {
   description: `${selectedRole} is not permitted to promote to ${targetEnvironment}.`
  });
  return;
 }

 setBusyTarget(targetEnvironment);
 setLastWarning(null);
 const toastId = notifyLoading("Creating promotion PR", {
  description: `${service} to ${targetEnvironment}.`
 });

 try {
  const response = await fetch("/api/promotions", {
   method: "POST",
   headers: {
    "Content-Type": "application/json"
   },
   body: JSON.stringify({
    service,
    owner,
    repo,
    targetEnvironment,
    actor: selectedRole
   })
  });
  const payload = await response.json() as PromotionApiSuccess | PromotionApiWarning;

  if (payload.mode === "warning") {
   setLastWarning(payload.warning);
   setLastPrUrl(payload.auditEvent?.prUrl ?? null);
   notifyWarning("Promotion warning", {
    id: toastId,
    description: payload.warning
   });
   return;
  }

  setLastPrUrl(payload.promotion.prUrl ?? null);
  setLastWarning(payload.warning ?? null);
  notifySuccess("Promotion PR ready", {
   id: toastId,
   description: payload.promotion.prUrl ? `Opened ${payload.promotion.branch}.` : "Promotion state recorded."
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Promotion request failed.";
  setLastWarning(message);
  notifyError("Promotion request failed", {
   id: toastId,
   description: message
  });
 } finally {
  setBusyTarget(null);
 }
 }

 return (
 <div className="grid min-w-[220px] gap-2">
 <div className="flex flex-wrap gap-2">
 <PromotionButton
 label="Promote dev to stage"
 targetEnvironment="stage"
 busy={busyTarget === "stage"}
 onClick={() => void promote("stage")}
 />
 <PromotionButton
 label="Promote stage to production"
 targetEnvironment="prod"
 busy={busyTarget === "prod"}
 onClick={() => void promote("prod")}
 />
 </div>
 {lastPrUrl ? (
 <a href={lastPrUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-slate-900">
 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
 View promotion PR
 </a>
 ) : null}
 {lastWarning ? <p className="text-xs leading-5 text-amber-800">{lastWarning}</p> : null}
 </div>
 );
}

function PromotionButton({
 label,
 targetEnvironment,
 busy,
 onClick
}: {
 label: string;
 targetEnvironment: TargetEnvironment;
 busy: boolean;
 onClick: () => void;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 disabled={busy}
 className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-canvas disabled:cursor-wait disabled:opacity-70"
 data-target-environment={targetEnvironment}
 >
 {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : targetEnvironment === "prod" ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />}
 {label}
 </button>
 );
}
