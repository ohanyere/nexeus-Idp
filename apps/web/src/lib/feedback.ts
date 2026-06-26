"use client";

import confetti from "canvas-confetti";
import { toast } from "sonner";
import type { ExternalToast } from "sonner";

type NotifyOptions = Pick<ExternalToast, "id" | "description" | "duration">;

const defaultDuration = 4200;

export function notifySuccess(message: string, options?: NotifyOptions) {
 return toast.success(message, {
 duration: defaultDuration,
 ...options
 });
}

export function notifyError(message: string, options?: NotifyOptions) {
 return toast.error(message, {
 duration: 5200,
 ...options
 });
}

export function notifyWarning(message: string, options?: NotifyOptions) {
 return toast.warning(message, {
 duration: defaultDuration,
 ...options
 });
}

export function notifyInfo(message: string, options?: NotifyOptions) {
 return toast.info(message, {
 duration: defaultDuration,
 ...options
 });
}

export function notifyLoading(message: string, options?: NotifyOptions) {
 return toast.loading(message, options);
}

export function celebrateSuccess() {
 const shared = {
 particleCount: 24,
 spread: 42,
 startVelocity: 28,
 scalar: 0.72,
 ticks: 90,
 gravity: 1,
 colors: ["#0f172a", "#2563eb", "#10b981", "#64748b"]
 };

 confetti({
 ...shared,
 origin: { x: 0.22, y: 0.18 },
 angle: 60
 });

 confetti({
 ...shared,
 particleCount: 18,
 origin: { x: 0.78, y: 0.18 },
 angle: 120
 });
}
