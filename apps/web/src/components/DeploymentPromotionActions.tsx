"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { notifyError, notifyLoading, notifySuccess, notifyWarning } from "@/lib/feedback";
import { ChevronDown, ExternalLink, GitPullRequest, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type TargetEnvironment = "stage" | "prod";
type ReleaseAction = "promote" | "rollback";
type DropdownKind = ReleaseAction | null;

type DeploymentPromotionActionsProps = {
 service: string;
 owner: string;
 repo: string;
 onDetails?: (detail: ReleaseActionDetail) => void;
 variant?: "light" | "dark";
};

export type ReleaseActionDetail = {
 service: string;
 environment: TargetEnvironment;
 reason: string;
 timestamp: string;
 details: string;
 kind: ReleaseAction;
 prUrl?: string;
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

type RollbackApiSuccess = {
 mode: "github";
 rollback: {
  targetEnvironment: TargetEnvironment;
  branch: string;
  rollbackSha: string;
  prUrl?: string;
  status: "pr_created" | "pr_open" | "unchanged" | "warning";
 };
 warning?: string;
};

type RollbackApiWarning = PromotionApiWarning;

export function DeploymentPromotionActions({ service, owner, repo, onDetails, variant = "light" }: DeploymentPromotionActionsProps) {
 const { can, selectedRole } = useMockSession();
 const [busyAction, setBusyAction] = useState<{ action: ReleaseAction; targetEnvironment: TargetEnvironment } | null>(null);
 const [openDropdown, setOpenDropdown] = useState<DropdownKind>(null);
 const [lastPrUrl, setLastPrUrl] = useState<string | null>(null);
 const [lastDetail, setLastDetail] = useState<ReleaseActionDetail | null>(null);

 function recordDetail(kind: ReleaseAction, targetEnvironment: TargetEnvironment, reason: string, prUrl?: string) {
 const detail = {
  service,
  environment: targetEnvironment,
  reason,
  timestamp: new Date().toISOString(),
  details: reason,
  kind,
  prUrl
 };

 setLastDetail(detail);
 onDetails?.(detail);
 }

 async function promote(targetEnvironment: TargetEnvironment) {
 const requiredPermission = targetEnvironment === "prod" ? "deploy to prod" : "deploy to stage";

 if (!can(requiredPermission)) {
  notifyWarning("Promotion blocked", {
   description: `${selectedRole} is not permitted to promote to ${targetEnvironment}.`
  });
  return;
 }

 setBusyAction({ action: "promote", targetEnvironment });
 setOpenDropdown(null);
 setLastDetail(null);
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
   setLastPrUrl(payload.auditEvent?.prUrl ?? null);
   recordDetail("promote", targetEnvironment, payload.warning, payload.auditEvent?.prUrl);
   notifyWarning("Promotion warning", {
    id: toastId,
    description: payload.warning
   });
   return;
  }

  setLastPrUrl(payload.promotion.prUrl ?? null);
  if (payload.warning) {
   recordDetail("promote", targetEnvironment, payload.warning, payload.promotion.prUrl);
  }
  notifySuccess("Promotion PR ready", {
   id: toastId,
   description: payload.promotion.prUrl ? `Opened ${payload.promotion.branch}.` : "Promotion state recorded."
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Promotion request failed.";
  recordDetail("promote", targetEnvironment, message);
  notifyError("Promotion request failed", {
   id: toastId,
   description: message
  });
 } finally {
  setBusyAction(null);
 }
 }

 async function rollback(targetEnvironment: TargetEnvironment) {
 if (!can("rollback deployment")) {
  notifyWarning("Rollback blocked", {
   description: `${selectedRole} is not permitted to roll back ${targetEnvironment}.`
  });
  return;
 }

 setBusyAction({ action: "rollback", targetEnvironment });
 setOpenDropdown(null);
 setLastDetail(null);
 const toastId = notifyLoading("Creating rollback PR", {
  description: `${service} ${targetEnvironment}.`
 });

 try {
  const response = await fetch("/api/rollbacks", {
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
  const payload = await response.json() as RollbackApiSuccess | RollbackApiWarning;

  if (payload.mode === "warning") {
   setLastPrUrl(payload.auditEvent?.prUrl ?? null);
   recordDetail("rollback", targetEnvironment, payload.warning, payload.auditEvent?.prUrl);
   notifyWarning("Rollback warning", {
    id: toastId,
    description: payload.warning
   });
   return;
  }

  setLastPrUrl(payload.rollback.prUrl ?? null);
  if (payload.warning) {
   recordDetail("rollback", targetEnvironment, payload.warning, payload.rollback.prUrl);
  }
  notifySuccess("Rollback PR ready", {
   id: toastId,
   description: payload.rollback.prUrl ? `Opened ${payload.rollback.branch}.` : `Rollback target ${payload.rollback.rollbackSha} recorded.`
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Rollback request failed.";
  recordDetail("rollback", targetEnvironment, message);
  notifyError("Rollback request failed", {
   id: toastId,
   description: message
  });
 } finally {
  setBusyAction(null);
 }
 }

 const buttonClass = variant === "dark"
 ? "inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-950 bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
 : "inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-canvas disabled:cursor-wait disabled:opacity-70";
 const menuClass = variant === "dark"
 ? "absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-card"
 : "absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-card";
 const menuItemClass = variant === "dark"
 ? "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
 : "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50";

 return (
 <div className="grid min-w-[210px] justify-items-end gap-2">
 <div className="flex flex-wrap justify-end gap-2">
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpenDropdown((current) => current === "promote" ? null : "promote")}
 disabled={busyAction?.action === "promote"}
 className={buttonClass}
 >
 {busyAction?.action === "promote" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />}
 Release
 <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 {openDropdown === "promote" ? (
 <div className={menuClass}>
 <ActionMenuItem
 className={menuItemClass}
 label="Promote Dev -> Stage"
 icon={<GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />}
 disabled={!can("deploy to stage") || Boolean(busyAction)}
 onClick={() => void promote("stage")}
 />
 <ActionMenuItem
 className={menuItemClass}
 label="Promote Stage -> Production"
 icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
 disabled={!can("deploy to prod") || Boolean(busyAction)}
 onClick={() => void promote("prod")}
 />
 </div>
 ) : null}
 </div>
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpenDropdown((current) => current === "rollback" ? null : "rollback")}
 disabled={busyAction?.action === "rollback"}
 className={buttonClass}
 >
 {busyAction?.action === "rollback" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
 Rollback
 <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 {openDropdown === "rollback" ? (
 <div className={menuClass}>
 <ActionMenuItem
 className={menuItemClass}
 label="Rollback Stage"
 icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
 disabled={!can("rollback deployment") || Boolean(busyAction)}
 onClick={() => void rollback("stage")}
 />
 <ActionMenuItem
 className={menuItemClass}
 label="Rollback Production"
 icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
 disabled={!can("rollback deployment") || Boolean(busyAction)}
 onClick={() => void rollback("prod")}
 />
 </div>
 ) : null}
 </div>
 </div>
 {lastPrUrl ? (
 <a href={lastPrUrl} target="_blank" rel="noreferrer" className={variant === "dark" ? "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950" : "inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-slate-900"}>
 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
 View release PR
 </a>
 ) : null}
 {lastDetail ? (
 <button type="button" onClick={() => onDetails?.(lastDetail)} className={variant === "dark" ? "text-right text-xs font-semibold text-amber-700 hover:text-amber-900" : "text-right text-xs font-semibold text-amber-800 hover:text-amber-950"}>
 {lastDetail.kind === "rollback" ? "Rollback unavailable" : "Release unavailable"} · View Details
 </button>
 ) : null}
 </div>
 );
}

function ActionMenuItem({
 label,
 icon,
 className,
 disabled,
 busy,
 onClick
}: {
 label: string;
 icon: ReactNode;
 className: string;
 disabled: boolean;
 busy?: boolean;
 onClick: () => void;
}) {
 return (
 <button type="button" onClick={onClick} disabled={disabled || busy} className={className}>
 {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : icon}
 {label}
 </button>
 );
}
