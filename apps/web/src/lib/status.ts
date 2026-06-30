import type { StatusTone } from "@/lib/mock-data";

export function toneClasses(tone: StatusTone = "neutral") {
  const tones: Record<StatusTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    info: "border-slate-200 bg-slate-50 text-slate-800",
    drift: "border-violet-200 bg-violet-50 text-violet-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700"
  };

  return tones[tone];
}

export function statusTone(status: string): StatusTone {
  const lower = status.toLowerCase();

  if (lower.includes("rollback") || lower.includes("failed") || lower.includes("fail") || lower.includes("violation") || lower.includes("not ready") || lower.includes("blocked") || lower.includes("critical")) {
    return "danger";
  }

  if (lower.includes("drift") || lower.includes("out of sync")) {
    return "drift";
  }

  if (lower.includes("deploying") || lower.includes("building") || lower.includes("running") || lower.includes("prepared")) {
    return "info";
  }

  if (
    lower.includes("healthy") ||
    lower.includes("ready") ||
    lower.includes("succeeded") ||
    lower.includes("synced") ||
    lower.includes("completed") ||
    lower.includes("passing") ||
    lower.includes("normal")
  ) {
    return "success";
  }

  if (
    lower.includes("warning") ||
    lower.includes("drift") ||
    lower.includes("provisioning") ||
    lower.includes("pending") ||
    lower.includes("open") ||
    lower.includes("paused") ||
    lower.includes("elevated") ||
    lower.includes("degraded") ||
    lower.includes("flapping")
  ) {
    return "warning";
  }

  return "neutral";
}
