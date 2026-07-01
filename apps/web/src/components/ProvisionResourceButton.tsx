"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { StatusBadge } from "@/components/StatusBadge";
import { gitOpsSupportedResourceIds, resourceCatalog } from "@/lib/infrastructure";
import type { GitOpsResourceId } from "@/lib/infrastructure";
import type { EnvironmentName } from "@/lib/mock-data";
import { services, teams } from "@/lib/mock-data";
import { Check, ExternalLink, GitPullRequest, X } from "lucide-react";
import { useMemo, useState } from "react";

type ProvisionResourceButtonProps = {
  resourceId?: string;
  serviceId?: string;
  serviceName?: string;
  teamName?: string;
  teamSlug?: string;
  repositoryOwner?: string;
  repositoryName?: string;
  repositoryUrl?: string;
  label?: string;
};

type ProvisionResult = {
  requestId: string;
  resourceType: string;
  claimName: string;
  claimKind: string;
  claimPath: string;
  branch: string;
  commitSha: string;
  prUrl: string;
  prNumber: number;
  status: string;
  gitOpsStatus: string;
  provisioningStatus: string;
  clusterStatus: string;
  manifest: string;
};

const steps = ["Team", "Environment", "Claim", "Review", "GitOps"];

export function ProvisionResourceButton({
  resourceId,
  serviceId,
  serviceName,
  teamName,
  teamSlug,
  repositoryOwner,
  repositoryName,
  repositoryUrl,
  label = "Provision"
}: ProvisionResourceButtonProps) {
  const { can, user } = useMockSession();
  const gitOpsResources = resourceCatalog.filter((resource) => resource.gitOpsResourceId && gitOpsSupportedResourceIds.includes(resource.gitOpsResourceId));
  const initialResource = gitOpsResources.find((resource) => resource.id === resourceId || resource.gitOpsResourceId === resourceId) ?? gitOpsResources[0];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [teamId, setTeamId] = useState(user.teamId);
  const [environment, setEnvironment] = useState<EnvironmentName>("dev");
  const [selectedResourceId, setSelectedResourceId] = useState(initialResource.id);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId ?? "");
  const [name, setName] = useState(serviceId ? `${serviceId}-${initialResource.type.toLowerCase().replaceAll(" ", "-")}` : `new-${initialResource.id}`);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const selectedResource = gitOpsResources.find((resource) => resource.id === selectedResourceId) ?? initialResource;
  const selectedTeam = teams.find((team) => team.id === teamId) ?? teams[0];
  const selectedService = services.find((service) => service.id === selectedServiceId);
  const selectedRepository = useMemo(() => {
    if (repositoryOwner && repositoryName) {
      return {
        owner: repositoryOwner,
        name: repositoryName,
        url: repositoryUrl || `https://github.com/${repositoryOwner}/${repositoryName}`
      };
    }

    return parseRepository(selectedService?.repository || selectedService?.documentation.repository);
  }, [repositoryName, repositoryOwner, repositoryUrl, selectedService]);
  const configuration = useMemo(() => defaultConfiguration(selectedResource.gitOpsResourceId), [selectedResource.gitOpsResourceId]);
  const effectiveServiceName = serviceName || selectedService?.name;
  const effectiveServiceId = serviceId || selectedService?.id;
  const effectiveTeamName = teamName || selectedService?.team || selectedTeam.name;
  const effectiveTeamSlug = teamSlug || selectedService?.teamId || selectedTeam.id;
  const canSubmit = Boolean(selectedResource.gitOpsResourceId && selectedRepository?.owner && selectedRepository.name && name.trim());

  if (!can("create resource")) {
    return null;
  }

  async function submitProvisionRequest() {
    if (!selectedResource.gitOpsResourceId || !selectedRepository) {
      setError("Select a GitOps-backed service repository before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/infrastructure/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resourceId: selectedResource.gitOpsResourceId,
          resourceName: name,
          teamName: effectiveTeamName,
          teamSlug: effectiveTeamSlug,
          environment,
          serviceId: effectiveServiceId,
          serviceName: effectiveServiceName,
          repositoryOwner: selectedRepository.owner,
          repositoryName: selectedRepository.name,
          repositoryUrl: selectedRepository.url,
          requester: user.name,
          requesterEmail: user.email,
          parameters: configuration
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        const details = Array.isArray(payload.details) ? ` ${payload.details.join(" ")}` : "";
        throw new Error(`${payload.error ?? "Provision request failed."}${details}`);
      }

      setResult(payload.provisionRequest as ProvisionResult);
      setStep(steps.length - 1);
    } catch (provisionError) {
      setError(provisionError instanceof Error ? provisionError.message : "Provision request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <section className="w-full max-w-4xl overflow-hidden rounded-md border border-line bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-line bg-canvas px-5 py-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Provision through GitOps</h2>
                <p className="mt-1 text-sm text-muted">Generate a Crossplane claim, commit it to the service overlay, and open an approval-gated GitHub pull request.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate-700 hover:bg-canvas" aria-label="Close provision wizard">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-5 px-5 py-5">
              <div className="grid gap-2 md:grid-cols-5">
                {steps.map((item, index) => (
                  <div key={item} className={index <= step ? "rounded-md bg-slate-950 px-2 py-1.5 text-center text-xs font-semibold text-white" : "rounded-md border border-line bg-white px-2 py-1.5 text-center text-xs font-semibold text-slate-600"}>
                    {item}
                  </div>
                ))}
              </div>

              {step === 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <WizardField label="Team">
                    <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm">
                      {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                  </WizardField>
                  <WizardField label="Service repository">
                    <select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)} disabled={Boolean(serviceId || repositoryOwner)} className="h-10 rounded-md border border-line px-3 text-sm disabled:bg-canvas">
                      <option value="">Select service</option>
                      {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                    </select>
                  </WizardField>
                </div>
              ) : null}
              {step === 1 ? (
                <WizardField label="Environment">
                  <select value={environment} onChange={(event) => setEnvironment(event.target.value as EnvironmentName)} className="h-10 rounded-md border border-line px-3 text-sm">
                    {selectedResource.supportedEnvironments.map((env) => <option key={env} value={env}>{env}</option>)}
                  </select>
                </WizardField>
              ) : null}
              {step === 2 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <WizardField label="Claim type"><select value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm">{gitOpsResources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></WizardField>
                  <WizardField label="Claim name"><input value={name} onChange={(event) => setName(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm" /></WizardField>
                  {Object.entries(configuration).map(([key, value]) => (
                    <WizardField key={key} label={key}><input value={String(value)} readOnly className="h-10 rounded-md border border-line bg-canvas px-3 text-sm text-slate-700" /></WizardField>
                  ))}
                </div>
              ) : null}
              {step === 3 ? (
                <dl className="grid gap-3 rounded-md border border-line bg-canvas p-4 text-sm md:grid-cols-2">
                  <Review label="Team" value={effectiveTeamName} />
                  <Review label="Environment" value={environment} />
                  <Review label="Claim API" value={selectedResource.name} />
                  <Review label="Claim name" value={name} />
                  <Review label="Service association" value={effectiveServiceName ?? "Select a service repository"} />
                  <Review label="GitOps repository" value={selectedRepository ? `${selectedRepository.owner}/${selectedRepository.name}` : "Required"} />
                </dl>
              ) : null}
              {step === 4 ? (
                <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  {result ? (
                    <>
                      <div className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4" /> GitOps provisioning request opened</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <Review label="Branch" value={result.branch} />
                        <Review label="Commit SHA" value={result.commitSha} />
                        <Review label="Claim path" value={result.claimPath} />
                        <Review label="PR status" value={result.status} />
                        <Review label="GitOps status" value={result.gitOpsStatus} />
                        <Review label="Cluster status" value={result.clusterStatus} />
                      </div>
                      <a href={result.prUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-100">
                        <GitPullRequest className="h-3.5 w-3.5" /> Open PR #{result.prNumber} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : (
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 font-semibold"><GitPullRequest className="h-4 w-4" /> Ready to create claim PR</div>
                      <StatusBadge label="GitOps repository required" tone={canSubmit ? "success" : "warning"} />
                    </div>
                  )}
                </div>
              ) : null}

              {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div> : null}

              <div className="flex justify-between gap-3">
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={submitting} className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-canvas disabled:opacity-60">Back</button>
                {step === steps.length - 2 ? (
                  <button type="button" onClick={submitProvisionRequest} disabled={!canSubmit || submitting} className="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                    {submitting ? "Creating PR..." : "Submit GitOps PR"}
                  </button>
                ) : (
                  <button type="button" onClick={() => step === steps.length - 1 ? setOpen(false) : setStep((current) => Math.min(steps.length - 1, current + 1))} disabled={submitting} className="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                    {step === steps.length - 1 ? "Close" : "Next"}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function defaultConfiguration(resourceId?: GitOpsResourceId) {
  switch (resourceId) {
    case "postgresql":
      return { region: "us-east-1", storageGB: 20, instanceClass: "db.t4g.micro", deletionPolicy: "Orphan" };
    case "redis":
      return { region: "us-east-1", nodeType: "cache.t4g.micro", numCacheNodes: 1, deletionPolicy: "Orphan" };
    case "s3-bucket":
      return { region: "us-east-1", versioning: true, deletionPolicy: "Orphan" };
    case "sqs-queue":
      return { region: "us-east-1", fifo: false, visibilityTimeoutSeconds: 30, deletionPolicy: "Orphan" };
    case "dynamodb-table":
      return { region: "us-east-1", hashKey: "id", billingMode: "PAY_PER_REQUEST", deletionPolicy: "Orphan" };
    default:
      return { region: "us-east-1", deletionPolicy: "Orphan" };
  }
}

function parseRepository(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\.git$/, "");
  const [owner, name] = normalized.split("/");

  if (!owner || !name) {
    return null;
  }

  return {
    owner,
    name,
    url: `https://github.com/${owner}/${name}`
  };
}

function WizardField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-800">{label}{children}</label>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-medium text-muted">{label}</dt><dd className="mt-1 break-all font-semibold text-slate-900">{value}</dd></div>;
}
