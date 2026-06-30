"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { resourceCatalog } from "@/lib/infrastructure";
import type { EnvironmentName } from "@/lib/mock-data";
import { teams } from "@/lib/mock-data";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";

type ProvisionResourceButtonProps = {
  resourceId?: string;
  serviceId?: string;
  serviceName?: string;
  label?: string;
};

const steps = ["Team", "Environment", "Configuration", "Review", "Submit"];

export function ProvisionResourceButton({ resourceId, serviceId, serviceName, label = "Provision" }: ProvisionResourceButtonProps) {
  const { can, user } = useMockSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [teamId, setTeamId] = useState(user.teamId);
  const [environment, setEnvironment] = useState<EnvironmentName>("dev");
  const [selectedResourceId, setSelectedResourceId] = useState(resourceId ?? resourceCatalog[0].id);
  const [name, setName] = useState(serviceId ? `${serviceId}-resource` : "new-resource");
  const selectedResource = resourceCatalog.find((resource) => resource.id === selectedResourceId) ?? resourceCatalog[0];
  const selectedTeam = teams.find((team) => team.id === teamId) ?? teams[0];
  const configuration = useMemo(() => ({
    version: selectedResource.type === "Redis" ? "7.2" : selectedResource.type === "PostgreSQL" ? "16" : "latest",
    memory: selectedResource.type === "Redis" ? "2Gi" : "standard",
    persistence: selectedResource.type === "Redis" ? "enabled" : "managed",
    highAvailability: environment === "prod" ? "enabled" : "disabled",
    backup: environment === "prod" ? "daily" : "none",
    region: "us-east-1",
    labels: `team=${teamId}, environment=${environment}`,
    tags: `service=${serviceId ?? "unassigned"}`
  }), [environment, selectedResource.type, serviceId, teamId]);

  if (!can("create resource")) {
    return null;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <section className="w-full max-w-3xl overflow-hidden rounded-md border border-line bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-line bg-canvas px-5 py-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Provision resource</h2>
                <p className="mt-1 text-sm text-muted">Mock request only. No Crossplane, Kubernetes, AWS, or Terraform call will run.</p>
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
                <WizardField label="Choose Team">
                  <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm">
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </WizardField>
              ) : null}
              {step === 1 ? (
                <WizardField label="Choose Environment">
                  <select value={environment} onChange={(event) => setEnvironment(event.target.value as EnvironmentName)} className="h-10 rounded-md border border-line px-3 text-sm">
                    {selectedResource.supportedEnvironments.map((env) => <option key={env} value={env}>{env}</option>)}
                  </select>
                </WizardField>
              ) : null}
              {step === 2 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <WizardField label="Resource Type"><select value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm">{resourceCatalog.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></WizardField>
                  <WizardField label="Name"><input value={name} onChange={(event) => setName(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm" /></WizardField>
                  {Object.entries(configuration).map(([key, value]) => (
                    <WizardField key={key} label={key}><input value={value} readOnly className="h-10 rounded-md border border-line bg-canvas px-3 text-sm text-slate-700" /></WizardField>
                  ))}
                </div>
              ) : null}
              {step === 3 ? (
                <dl className="grid gap-3 rounded-md border border-line bg-canvas p-4 text-sm md:grid-cols-2">
                  <Review label="Team" value={selectedTeam.name} />
                  <Review label="Environment" value={environment} />
                  <Review label="Resource" value={selectedResource.name} />
                  <Review label="Name" value={name} />
                  <Review label="Service association" value={serviceName ?? "Not linked"} />
                  <Review label="Estimated cost" value={selectedResource.estimatedMonthlyCost} />
                </dl>
              ) : null}
              {step === 4 ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <div className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4" /> Mock provision request submitted</div>
                  <p className="mt-1">Developer submit to Platform Engineer approval to provisioning is represented in mock request timelines.</p>
                </div>
              ) : null}

              <div className="flex justify-between gap-3">
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-canvas">Back</button>
                <button type="button" onClick={() => step === steps.length - 1 ? setOpen(false) : setStep((current) => Math.min(steps.length - 1, current + 1))} className="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
                  {step === steps.length - 1 ? "Close" : step === steps.length - 2 ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function WizardField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium capitalize text-slate-800">{label}{children}</label>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-medium text-muted">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>;
}
