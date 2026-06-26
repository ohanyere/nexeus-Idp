"use client";

import { notifyInfo, notifySuccess, notifyWarning, celebrateSuccess } from "@/lib/feedback";

type MockActionButtonProps = {
 label: string;
 result: string;
 tone?: "success" | "warning" | "info";
 celebrate?: boolean;
};

export function MockActionButton({ label, result, tone = "success", celebrate = false }: MockActionButtonProps) {
 function handleClick() {
 if (tone === "warning") {
 notifyWarning(result);
 } else if (tone === "info") {
 notifyInfo(result);
 } else {
 notifySuccess(result);
 }

 if (celebrate) {
 celebrateSuccess();
 }
 }

 return (
 <button
 type="button"
 onClick={handleClick}
 className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-canvas"
 >
 {label}
 </button>
 );
}
