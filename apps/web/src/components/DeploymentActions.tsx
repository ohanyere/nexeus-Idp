"use client";

import { deployNewVersionDefaults, services } from "@/lib/mock-data";
import type { DeploymentRecord, EnvironmentName, Permission, RolloutStrategy } from "@/lib/mock-data";
import { useMockSession } from "@/components/MockSessionContext";
import { notifyError, notifyLoading, notifySuccess } from "@/lib/feedback";
import { Rocket, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type RollbackButtonProps = {
 deployment: DeploymentRecord;
 compact?: boolean;
};

export function RollbackButton({ deployment, compact = false }: RollbackButtonProps) {
 const { can, selectedRole } = useMockSession();
 const [open, setOpen] = useState(false);
 const [selectedVersion, setSelectedVersion] = useState(deployment.previousStableVersions[0]?.version ?? "");

 const target = deployment.previousStableVersions.find((version) => version.version === selectedVersion);

 if (!can("rollback deployment")) {
 return null;
 }

 function handleRollbackRequest() {
 if (!can("rollback deployment")) {
 notifyError("Rollback request blocked", {
 description: `${selectedRole} cannot request rollbacks with the current RBAC policy.`
 });
 return;
 }

 notifySuccess("Rollback request recorded", {
 description: `${deployment.service} ${deployment.environment} rollback to ${selectedVersion} was simulated.`
 });
 }

 return (
 <>
 <button
 type="button"
 onClick={() => setOpen(true)}
 className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-canvas"
 >
 <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
 {compact ? "Rollback" : "Request rollback"}
 </button>

 {open ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
 <section className="w-full max-w-xl overflow-hidden rounded-md border border-line bg-white shadow-none">
 <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-canvas px-5 py-4">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">Confirm rollback request</h2>
 <p className="mt-1 text-sm text-muted">
 {deployment.service} {deployment.environment} is currently on {deployment.version}.
 </p>
 </div>
 <button
 type="button"
 onClick={() => setOpen(false)}
 className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
 aria-label="Close rollback panel"
 >
 <X className="h-4 w-4" aria-hidden="true" />
 </button>
 </div>

 <div className="grid gap-4 px-5 py-5">
 <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
 This rollback is a request preview. No GitOps change, ArgoCD sync, Argo Rollouts action, or Kubernetes update will be triggered.
 </p>
 {!can("rollback deployment") ? (
 <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
 {selectedRole} cannot request rollbacks with the current RBAC policy.
 </p>
 ) : null}

 <label className="grid gap-2 text-sm font-medium text-slate-800">
 Previous stable version
 <select
 value={selectedVersion}
 onChange={(event) => setSelectedVersion(event.target.value)}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-brand"
 >
 {deployment.previousStableVersions.map((version) => (
 <option key={version.version} value={version.version}>{version.version}</option>
 ))}
 </select>
 </label>

 {target ? (
 <dl className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
 <div>
 <dt className="font-medium text-muted">Image tag</dt>
 <dd className="mt-1 break-all font-semibold text-slate-800">{target.image}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Commit SHA</dt>
 <dd className="mt-1 font-semibold text-slate-800">{target.commit}</dd>
 </div>
 <div>
 <dt className="font-medium text-muted">Previously deployed at</dt>
 <dd className="mt-1 font-semibold text-slate-800">{target.deployedAt}</dd>
 </div>
 </dl>
 ) : null}

 <button
 type="button"
 onClick={handleRollbackRequest}
 disabled={!can("rollback deployment")}
 className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-none transition hover:bg-brand disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
 >
 Confirm rollback request
 </button>
 </div>
 </section>
 </div>
 ) : null}
 </>
 );
}

export function DeployNewVersionButton() {
 const { can, selectedRole } = useMockSession();
 const [open, setOpen] = useState(false);
 const [form, setForm] = useState<{
 serviceId: string;
 environment: EnvironmentName;
 version: string;
 imageTag: string;
 rolloutStrategy: RolloutStrategy;
 }>({
 serviceId: services[0]?.id ?? "",
 environment: "dev",
 version: "v1.0.0",
 imageTag: "docker.io/kuberpull/new-service:1.0.0",
 rolloutStrategy: "standard"
 });

 const selectedService = useMemo(
 () => services.find((service) => service.id === form.serviceId),
 [form.serviceId]
 );

 function handleSubmit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault();
 if (!allowed) {
 notifyError("Deployment request blocked", {
 description: `${selectedRole} does not have permission to ${requiredPermission}.`
 });
 return;
 }

 const toastId = notifyLoading("Recording deployment request", {
 description: `${selectedService?.name} ${form.version} to ${form.environment}.`
 });

 notifySuccess("Deployment request recorded", {
 id: toastId,
 description: "The request was recorded. No deployment system was called."
 });
 }

 const requiredPermission: Permission = form.environment === "prod" ? "deploy to prod" : form.environment === "stage" ? "deploy to stage" : "deploy to dev";
 const allowed = can(requiredPermission);

 if (!can("deploy to dev") && !can("deploy to stage") && !can("deploy to prod")) {
 return null;
 }

 return (
 <>
 <button
 type="button"
 onClick={() => {
 setOpen(true);
 }}
 className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-none transition hover:bg-brand"
 >
 <Rocket className="h-4 w-4" aria-hidden="true" />
 Deploy New Version
 </button>

 {open ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
 <section className="w-full max-w-2xl overflow-hidden rounded-md border border-line bg-white shadow-none">
 <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-canvas px-5 py-4">
 <div>
 <h2 className="font-heading text-lg font-semibold text-ink">Deploy new version</h2>
 <p className="mt-1 text-sm text-muted">Deployment request preview only. No external systems will be called.</p>
 </div>
 <button
 type="button"
 onClick={() => setOpen(false)}
 className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
 aria-label="Close deploy panel"
 >
 <X className="h-4 w-4" aria-hidden="true" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5">
 <div className="grid gap-4 md:grid-cols-2">
 <label className="grid gap-2 text-sm font-medium text-slate-800">
 Service
 <select
 value={form.serviceId}
 onChange={(event) => setForm((current) => ({ ...current, serviceId: event.target.value }))}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-brand"
 >
 {services.map((service) => (
 <option key={service.id} value={service.id}>{service.name}</option>
 ))}
 </select>
 </label>

 <label className="grid gap-2 text-sm font-medium text-slate-800">
 Environment
 <select
 value={form.environment}
 onChange={(event) => setForm((current) => ({ ...current, environment: event.target.value as EnvironmentName }))}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-brand"
 >
 {deployNewVersionDefaults.environments.map((environment) => (
 <option key={environment} value={environment}>{environment}</option>
 ))}
 </select>
 </label>

 <label className="grid gap-2 text-sm font-medium text-slate-800">
 Version
 <input
 value={form.version}
 onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-brand"
 />
 </label>

 <label className="grid gap-2 text-sm font-medium text-slate-800">
 Version/image tag
 <input
 value={form.imageTag}
 onChange={(event) => setForm((current) => ({ ...current, imageTag: event.target.value }))}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink outline-none transition focus:border-brand"
 />
 </label>
 </div>

 <fieldset>
 <legend className="text-sm font-semibold text-slate-800">Rollout strategy</legend>
 <div className="mt-3 grid gap-2 md:grid-cols-2">
 {deployNewVersionDefaults.rolloutStrategies.map((strategy) => (
 <label key={strategy} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
 <input
 type="radio"
 checked={form.rolloutStrategy === strategy}
 onChange={() => setForm((current) => ({ ...current, rolloutStrategy: strategy }))}
 className="h-4 w-4 accent-brand"
 />
 {strategy}
 </label>
 ))}
 </div>
 </fieldset>

 <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
 <p className="font-semibold text-ink">Request preview</p>
 <p className="mt-1">{selectedService?.name} to {form.environment} using {form.imageTag}</p>
 <p className="mt-1">Rollout strategy: {form.rolloutStrategy}</p>
 </div>
 {!allowed ? (
 <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
 {selectedRole} does not have permission to {requiredPermission}. This request is blocked.
 </div>
 ) : null}

 <button
 type="submit"
 disabled={!allowed}
 className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-none transition hover:bg-brand disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
 >
 Start deployment request
 </button>

 </form>
 </section>
 </div>
 ) : null}
 </>
 );
}

export function ViewLogsButton({ deploymentId }: { deploymentId: string }) {
 return (
 <Link
 href={`/deployments/${deploymentId}`}
 className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-canvas"
 >
 View logs
 </Link>
 );
}
