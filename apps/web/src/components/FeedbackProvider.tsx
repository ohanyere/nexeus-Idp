"use client";

import { Toaster } from "sonner";

export function FeedbackProvider() {
 return (
 <Toaster
 position="top-right"
 richColors
 closeButton
 toastOptions={{
 duration: 4200,
 classNames: {
 toast: "border border-slate-200 bg-white text-slate-950 shadow-panel",
 title: "text-sm font-semibold",
 description: "text-sm text-slate-600",
 actionButton: "bg-slate-950 text-white",
 cancelButton: "bg-slate-100 text-slate-700"
 }
 }}
 />
 );
}
