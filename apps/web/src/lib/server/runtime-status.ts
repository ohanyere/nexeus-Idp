import "server-only";

import { Octokit } from "@octokit/rest";

import type { GovernanceRuntimeSnapshot, PolicySeverity, RuntimePolicyViolation } from "@/lib/governance";
import type { EnvironmentName, StatusTone } from "@/lib/mock-data";
import type { ServiceKubernetesResource, ServiceResourceInventory, KubernetesResourceKind, KubernetesResourceStatus } from "@/lib/service-resources";
import { kubernetesResourceStatusTone } from "@/lib/service-resources";
import { statusTone } from "@/lib/status";

export type RuntimeSource = "GitHub" | "ArgoCD" | "Cluster" | "Crossplane" | "Kyverno" | "Seed" | "Demo";

export type RuntimeSignal = {
  label: string;
  value: string;
  tone: StatusTone;
  source: RuntimeSource;
  detail?: string;
};

export type RuntimeStatusSnapshot = {
  serviceId: string;
  serviceName: string;
  generatedAt: string;
  warnings: string[];
  github: RuntimeSignal[];
  argocd: RuntimeSignal[];
  rollout: RuntimeSignal[];
  hpa: RuntimeSignal[];
  pods: RuntimeSignal[];
  governance: RuntimeSignal[];
  resourceInventory: ServiceResourceInventory;
  timelineEvents: Array<{
    id: string;
    label: string;
    detail: string;
    source: RuntimeSource;
    status: "succeeded" | "running" | "waiting" | "failed" | "warning";
    tone: StatusTone;
    time: string;
  }>;
};

export type RuntimeServiceInput = {
  serviceId: string;
  serviceName: string;
  repositoryUrl?: string;
  repositoryOwner?: string;
  repositoryName?: string;
  dockerImage?: string;
  environments: EnvironmentName[];
};

export type ProvisionRuntimeOverlay = {
  gitOpsStatus?: string;
  gitOpsSource?: RuntimeSource;
  provisioningStatus?: string;
  provisioningSource?: RuntimeSource;
  clusterStatus?: string;
  clusterSource?: RuntimeSource;
  warnings: string[];
};

type KubernetesList<T> = {
  items?: T[];
};

type KubernetesMetadata = {
  name?: string;
  namespace?: string;
  creationTimestamp?: string;
};

type KubernetesCondition = {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
};

type KubernetesObject = {
  metadata?: KubernetesMetadata;
  status?: {
    phase?: string;
    conditions?: KubernetesCondition[];
    availableReplicas?: number;
    readyReplicas?: number;
    replicas?: number;
    currentReplicas?: number;
    desiredReplicas?: number;
    currentCPUUtilizationPercentage?: number;
    currentMetrics?: Array<{ resource?: { name?: string; current?: { averageUtilization?: number; averageValue?: string } } }>;
  };
  spec?: {
    replicas?: number;
  };
};

type PolicyReportResult = {
  policy?: string;
  rule?: string;
  result?: string;
  severity?: string;
  message?: string;
  source?: string;
  resources?: Array<{
    kind?: string;
    name?: string;
    namespace?: string;
  }>;
};

type PolicyReport = {
  metadata?: KubernetesMetadata;
  scope?: {
    kind?: string;
    name?: string;
    namespace?: string;
  };
  summary?: {
    pass?: number;
    fail?: number;
    warn?: number;
    error?: number;
  };
  results?: PolicyReportResult[];
};

type ArgoApplication = {
  metadata?: {
    name?: string;
  };
  status?: {
    sync?: {
      status?: string;
      revision?: string;
    };
    health?: {
      status?: string;
      message?: string;
    };
    operationState?: {
      finishedAt?: string;
      phase?: string;
      message?: string;
    };
  };
};

const sourceUnavailable: Record<RuntimeSource, string> = {
  GitHub: "GitHub credentials or repository metadata are unavailable.",
  ArgoCD: "ArgoCD_BASE_URL and ARGOCD_TOKEN are not configured.",
  Cluster: "KUBERNETES_API_URL and Kubernetes bearer token are not configured.",
  Crossplane: "Kubernetes API access is required to read Crossplane claims.",
  Kyverno: "Kubernetes API access is required to read Kyverno PolicyReports.",
  Seed: "Catalog seed data is available, but it is not live runtime state.",
  Demo: "Reference data is available, but it is not live runtime state."
};

function signal(label: string, value: string, source: RuntimeSource, detail?: string): RuntimeSignal {
  return {
    label,
    value,
    tone: statusTone(value),
    source,
    detail
  };
}

function unavailable(label: string, source: RuntimeSource, detail = sourceUnavailable[source]): RuntimeSignal {
  return {
    label,
    value: "Unavailable",
    tone: "warning",
    source,
    detail
  };
}

function parseRepository(input: RuntimeServiceInput) {
  if (input.repositoryOwner && input.repositoryName) {
    return {
      owner: input.repositoryOwner,
      repo: input.repositoryName
    };
  }

  if (!input.repositoryUrl) {
    return null;
  }

  const normalized = input.repositoryUrl.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\.git$/, "");
  const [owner, repo] = normalized.split("/");

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

function githubClient() {
  const token = process.env.GITHUB_TOKEN?.trim();

  if (!token) {
    return null;
  }

  return new Octokit({ auth: token });
}

function argoConfig() {
  const baseUrl = process.env.ARGOCD_BASE_URL?.trim();
  const token = process.env.ARGOCD_TOKEN?.trim();

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    token
  };
}

function kubernetesConfig() {
  const baseUrl = process.env.KUBERNETES_API_URL?.trim();
  const token = process.env.KUBERNETES_BEARER_TOKEN?.trim() || process.env.KUBERNETES_TOKEN?.trim();

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    token
  };
}

async function fetchJson<T>(url: string, headers: HeadersInit) {
  const response = await fetch(url, {
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function getGitHubSignals(input: RuntimeServiceInput) {
  const client = githubClient();
  const repo = parseRepository(input);

  if (!client || !repo) {
    return {
      signals: [unavailable("Last Commit", "GitHub"), unavailable("Workflow Status", "GitHub"), signal("Container Image", input.dockerImage ?? "Unknown", "Seed", "Image is inferred from catalog data.")],
      warnings: [sourceUnavailable.GitHub],
      events: []
    };
  }

  try {
    const repository = await client.repos.get({ owner: repo.owner, repo: repo.repo });
    const branch = repository.data.default_branch || "main";
    const [commit, runs] = await Promise.all([
      client.repos.getCommit({ owner: repo.owner, repo: repo.repo, ref: branch }),
      client.actions.listWorkflowRunsForRepo({ owner: repo.owner, repo: repo.repo, branch, per_page: 1 })
    ]);
    const run = runs.data.workflow_runs[0];
    const shortSha = commit.data.sha.slice(0, 7);
    const workflow = run ? run.conclusion || run.status || "unknown" : "No workflow runs";

    return {
      signals: [
        signal("Last Commit", shortSha, "GitHub", commit.data.commit.message),
        signal("Workflow Status", workflow, "GitHub", run?.html_url),
        signal("Container Image", input.dockerImage || `kuberpull/${input.serviceId}:${shortSha}`, "GitHub", "Image tag inferred from the latest repository commit.")
      ],
      warnings: [],
      events: [
        {
          id: `${input.serviceId}-github-commit`,
          label: "Latest GitHub commit",
          detail: `${shortSha} on ${branch}: ${commit.data.commit.message}`,
          source: "GitHub" as RuntimeSource,
          status: "succeeded" as const,
          tone: "success" as StatusTone,
          time: commit.data.commit.author?.date ?? new Date().toISOString()
        },
        {
          id: `${input.serviceId}-github-workflow`,
          label: "Latest workflow",
          detail: run ? `${run.name ?? "Workflow"} ${workflow}` : "No workflow run was returned by GitHub.",
          source: "GitHub" as RuntimeSource,
          status: workflow.toLowerCase().includes("fail") ? "failed" as const : workflow.toLowerCase().includes("progress") ? "running" as const : "succeeded" as const,
          tone: statusTone(workflow),
          time: run?.updated_at ?? new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    const warning = `GitHub runtime status unavailable: ${error instanceof Error ? error.message : "Unknown GitHub error."}`;

    return {
      signals: [unavailable("Last Commit", "GitHub", warning), unavailable("Workflow Status", "GitHub", warning), signal("Container Image", input.dockerImage ?? "Unknown", "Seed", "Image is inferred from catalog data.")],
      warnings: [warning],
      events: []
    };
  }
}

async function fetchArgoApplication(appName: string) {
  const config = argoConfig();

  if (!config) {
    return null;
  }

  return fetchJson<ArgoApplication>(
    `${config.baseUrl}/api/v1/applications/${encodeURIComponent(appName)}`,
    {
      Authorization: `Bearer ${config.token}`
    }
  );
}

async function getArgoSignals(input: RuntimeServiceInput) {
  const config = argoConfig();

  if (!config) {
    return {
      signals: [unavailable("Application Status", "ArgoCD"), unavailable("Sync", "ArgoCD"), unavailable("Health", "ArgoCD"), unavailable("Last Sync", "ArgoCD")],
      warnings: [sourceUnavailable.ArgoCD],
      events: []
    };
  }

  for (const environment of input.environments) {
    const appName = `${input.serviceId}-${environment}`;

    try {
      const app = await fetchArgoApplication(appName);

      if (!app) {
        continue;
      }

      const sync = app.status?.sync?.status ?? "Unknown";
      const health = app.status?.health?.status ?? "Unknown";
      const revision = app.status?.sync?.revision?.slice(0, 7) ?? "Unknown";
      const lastSync = app.status?.operationState?.finishedAt ?? "Not synced";

      return {
        signals: [
          signal("Application Status", app.status?.operationState?.phase ?? "Observed", "ArgoCD", app.metadata?.name ?? appName),
          signal("Sync", sync, "ArgoCD", app.status?.sync?.revision),
          signal("Health", health, "ArgoCD", app.status?.health?.message),
          signal("Revision", revision, "ArgoCD"),
          signal("Last Sync", lastSync, "ArgoCD")
        ],
        warnings: [],
        events: [
          {
            id: `${input.serviceId}-argocd-${environment}`,
            label: "ArgoCD application observed",
            detail: `${appName} sync=${sync}, health=${health}, revision=${revision}`,
            source: "ArgoCD" as RuntimeSource,
            status: sync.toLowerCase() === "synced" && health.toLowerCase() === "healthy" ? "succeeded" as const : "warning" as const,
            tone: sync.toLowerCase() === "synced" && health.toLowerCase() === "healthy" ? "success" as StatusTone : "warning" as StatusTone,
            time: lastSync
          }
        ]
      };
    } catch {
      // Try the next environment before reporting a warning.
    }
  }

  const warning = `ArgoCD reachable at ${config.baseUrl}, but no application was found for ${input.serviceId}.`;

  return {
    signals: [unavailable("Application Status", "ArgoCD", warning), unavailable("Sync", "ArgoCD", warning), unavailable("Health", "ArgoCD", warning), unavailable("Last Sync", "ArgoCD", warning)],
    warnings: [warning],
    events: []
  };
}

async function kubeGet<T>(path: string) {
  const config = kubernetesConfig();

  if (!config) {
    return null;
  }

  return fetchJson<T>(
    `${config.baseUrl}${path}`,
    {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json"
    }
  );
}

function namespaceFor(serviceId: string, environment: EnvironmentName) {
  return `${serviceId}-${environment}`;
}

function resourceStatusFromObject(object: KubernetesObject): KubernetesResourceStatus {
  const conditions = object.status?.conditions ?? [];
  const ready = conditions.find((condition) => condition.type === "Ready" || condition.type === "Available");

  if (ready?.status === "True") {
    return "Healthy";
  }

  if (ready?.status === "False") {
    return "Failed";
  }

  const phase = object.status?.phase;

  if (phase === "Running" || phase === "Succeeded") {
    return "Healthy";
  }

  if (phase === "Pending") {
    return "Pending";
  }

  if (phase === "Failed") {
    return "Failed";
  }

  return "Unknown";
}

function clusterResource(input: {
  serviceId: string;
  environment: EnvironmentName;
  kind: KubernetesResourceKind;
  name: string;
  namespace: string;
  status: KubernetesResourceStatus;
  summary: string;
  desired?: string;
  current?: string;
  lastUpdated?: string;
}): ServiceKubernetesResource {
  return {
    id: `${input.serviceId}-${input.environment}-${input.kind}-${input.name}`,
    serviceId: input.serviceId,
    environment: input.environment,
    kind: input.kind,
    name: input.name,
    namespace: input.namespace,
    status: input.status,
    tone: kubernetesResourceStatusTone(input.status),
    age: "live",
    summary: input.summary,
    desired: input.desired,
    current: input.current,
    lastUpdated: input.lastUpdated ?? new Date().toISOString(),
    source: "Cluster"
  };
}

function emptyClusterInventory(serviceId: string, warning?: string): ServiceResourceInventory {
  return {
    serviceId,
    generatedAt: new Date().toISOString(),
    source: "Cluster",
    warning,
    resources: []
  };
}

async function getClusterInventory(input: RuntimeServiceInput): Promise<{ inventory: ServiceResourceInventory; warnings: string[]; rollout: RuntimeSignal[]; hpa: RuntimeSignal[]; pods: RuntimeSignal[]; events: RuntimeStatusSnapshot["timelineEvents"] }> {
  if (!kubernetesConfig()) {
    return {
      inventory: emptyClusterInventory(input.serviceId, sourceUnavailable.Cluster),
      warnings: [sourceUnavailable.Cluster],
      rollout: [unavailable("Rollout Phase", "Cluster"), unavailable("Rollout Health", "Cluster")],
      hpa: [unavailable("HPA Current", "Cluster"), unavailable("HPA Desired", "Cluster"), unavailable("CPU", "Cluster"), unavailable("Memory", "Cluster")],
      pods: [unavailable("Running Pods", "Cluster"), unavailable("Pending Pods", "Cluster"), unavailable("Failed Pods", "Cluster")],
      events: []
    };
  }

  const resources: ServiceKubernetesResource[] = [];
  const warnings: string[] = [];
  let runningPods = 0;
  let pendingPods = 0;
  let failedPods = 0;
  let hpaCurrent = "Unknown";
  let hpaDesired = "Unknown";
  let hpaCpu = "Unknown";
  let hpaMemory = "Unknown";
  let rolloutPhase = "Unknown";
  let rolloutHealth = "Unknown";
  const events: RuntimeStatusSnapshot["timelineEvents"] = [];

  for (const environment of input.environments) {
    const namespace = namespaceFor(input.serviceId, environment);

    try {
      const [pods, services, hpas, pdbs, networkPolicies, k8sEvents, rollouts] = await Promise.all([
        kubeGet<KubernetesList<KubernetesObject>>(`/api/v1/namespaces/${namespace}/pods`),
        kubeGet<KubernetesList<KubernetesObject>>(`/api/v1/namespaces/${namespace}/services`),
        kubeGet<KubernetesList<KubernetesObject>>(`/apis/autoscaling/v2/namespaces/${namespace}/horizontalpodautoscalers`),
        kubeGet<KubernetesList<KubernetesObject>>(`/apis/policy/v1/namespaces/${namespace}/poddisruptionbudgets`),
        kubeGet<KubernetesList<KubernetesObject>>(`/apis/networking.k8s.io/v1/namespaces/${namespace}/networkpolicies`),
        kubeGet<KubernetesList<KubernetesObject & { reason?: string; message?: string; lastTimestamp?: string; eventTime?: string }>>(`/api/v1/namespaces/${namespace}/events`),
        kubeGet<KubernetesList<KubernetesObject>>(`/apis/argoproj.io/v1alpha1/namespaces/${namespace}/rollouts`)
      ]);

      for (const pod of pods?.items ?? []) {
        const status = resourceStatusFromObject(pod);
        runningPods += status === "Healthy" ? 1 : 0;
        pendingPods += status === "Pending" ? 1 : 0;
        failedPods += status === "Failed" ? 1 : 0;
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "Pod",
          name: pod.metadata?.name ?? "pod",
          namespace,
          status,
          summary: pod.status?.phase ?? "Pod observed from Kubernetes API.",
          desired: "Running",
          current: pod.status?.phase,
          lastUpdated: pod.metadata?.creationTimestamp
        }));
      }

      for (const service of services?.items ?? []) {
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "Service",
          name: service.metadata?.name ?? "service",
          namespace,
          status: "Healthy",
          summary: "Service observed from Kubernetes API.",
          desired: "Service exists",
          current: "Observed",
          lastUpdated: service.metadata?.creationTimestamp
        }));
      }

      for (const hpa of hpas?.items ?? []) {
        hpaCurrent = String(hpa.status?.currentReplicas ?? "Unknown");
        hpaDesired = String(hpa.status?.desiredReplicas ?? "Unknown");
        const cpuMetric = hpa.status?.currentMetrics?.find((metric) => metric.resource?.name === "cpu");
        const memoryMetric = hpa.status?.currentMetrics?.find((metric) => metric.resource?.name === "memory");
        hpaCpu = cpuMetric?.resource?.current?.averageUtilization ? `${cpuMetric.resource.current.averageUtilization}%` : cpuMetric?.resource?.current?.averageValue ?? "Unknown";
        hpaMemory = memoryMetric?.resource?.current?.averageUtilization ? `${memoryMetric.resource.current.averageUtilization}%` : memoryMetric?.resource?.current?.averageValue ?? "Unknown";
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "HPA",
          name: hpa.metadata?.name ?? "hpa",
          namespace,
          status: resourceStatusFromObject(hpa),
          summary: "HorizontalPodAutoscaler observed from Kubernetes API.",
          desired: hpaDesired,
          current: hpaCurrent,
          lastUpdated: hpa.metadata?.creationTimestamp
        }));
      }

      for (const pdb of pdbs?.items ?? []) {
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "PodDisruptionBudget",
          name: pdb.metadata?.name ?? "pdb",
          namespace,
          status: resourceStatusFromObject(pdb),
          summary: "PodDisruptionBudget observed from Kubernetes API.",
          desired: "Budget satisfied",
          current: pdb.status?.conditions?.[0]?.status,
          lastUpdated: pdb.metadata?.creationTimestamp
        }));
      }

      for (const policy of networkPolicies?.items ?? []) {
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "NetworkPolicy",
          name: policy.metadata?.name ?? "network-policy",
          namespace,
          status: "Healthy",
          summary: "NetworkPolicy observed from Kubernetes API.",
          desired: "Policy exists",
          current: "Observed",
          lastUpdated: policy.metadata?.creationTimestamp
        }));
      }

      for (const rollout of rollouts?.items ?? []) {
        const status = resourceStatusFromObject(rollout);
        rolloutPhase = rollout.status?.phase ?? status;
        rolloutHealth = status;
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "Rollout",
          name: rollout.metadata?.name ?? "rollout",
          namespace,
          status,
          summary: rollout.status?.conditions?.[0]?.message ?? "Argo Rollout observed from Kubernetes API.",
          desired: String(rollout.spec?.replicas ?? rollout.status?.replicas ?? "Unknown"),
          current: String(rollout.status?.readyReplicas ?? rollout.status?.availableReplicas ?? "Unknown"),
          lastUpdated: rollout.metadata?.creationTimestamp
        }));
      }

      for (const event of (k8sEvents?.items ?? []).slice(-8)) {
        resources.push(clusterResource({
          serviceId: input.serviceId,
          environment,
          kind: "Event",
          name: event.metadata?.name ?? "event",
          namespace,
          status: event.reason?.toLowerCase().includes("fail") ? "Failed" : "Healthy",
          summary: event.message ?? event.reason ?? "Kubernetes event observed.",
          desired: "No warning events",
          current: event.reason,
          lastUpdated: event.lastTimestamp ?? event.eventTime ?? event.metadata?.creationTimestamp
        }));
        events.push({
          id: `${input.serviceId}-${environment}-${event.metadata?.name ?? Math.random()}`,
          label: event.reason ?? "Kubernetes event",
          detail: event.message ?? "Kubernetes event observed.",
          source: "Cluster",
          status: event.reason?.toLowerCase().includes("fail") ? "failed" : "succeeded",
          tone: event.reason?.toLowerCase().includes("fail") ? "danger" : "success",
          time: event.lastTimestamp ?? event.eventTime ?? event.metadata?.creationTimestamp ?? new Date().toISOString()
        });
      }
    } catch (error) {
      warnings.push(`Kubernetes namespace ${namespace} unavailable: ${error instanceof Error ? error.message : "Unknown Kubernetes error."}`);
    }
  }

  if (resources.length === 0) {
    const warning = warnings.join(" ") || undefined;

    return {
      inventory: emptyClusterInventory(input.serviceId, warning),
      warnings,
      rollout: [unavailable("Rollout Phase", "Cluster", "No live rollout was discovered."), unavailable("Rollout Health", "Cluster", "No live rollout was discovered.")],
      hpa: [unavailable("HPA Current", "Cluster", "No live HPA was discovered."), unavailable("HPA Desired", "Cluster", "No live HPA was discovered."), unavailable("CPU", "Cluster", "No live HPA metrics were discovered."), unavailable("Memory", "Cluster", "No live HPA metrics were discovered.")],
      pods: [signal("Running Pods", "0", "Cluster", "No live pods were discovered."), signal("Pending Pods", "0", "Cluster", "No live pods were discovered."), signal("Failed Pods", "0", "Cluster", "No live pods were discovered.")],
      events
    };
  }

  return {
    inventory: {
      serviceId: input.serviceId,
      generatedAt: new Date().toISOString(),
      source: "Cluster",
      warning: warnings.join(" ") || undefined,
      resources
    },
    warnings,
    rollout: [signal("Rollout Phase", rolloutPhase, "Cluster"), signal("Rollout Health", rolloutHealth, "Cluster")],
    hpa: [signal("HPA Current", hpaCurrent, "Cluster"), signal("HPA Desired", hpaDesired, "Cluster"), signal("CPU", hpaCpu, "Cluster"), signal("Memory", hpaMemory, "Cluster")],
    pods: [signal("Running Pods", String(runningPods), "Cluster"), signal("Pending Pods", String(pendingPods), "Cluster"), signal("Failed Pods", String(failedPods), "Cluster")],
    events
  };
}

async function getGovernanceSignals(input: RuntimeServiceInput) {
  if (!kubernetesConfig()) {
    return {
      signals: [unavailable("PolicyReports", "Kyverno"), unavailable("Violations", "Kyverno")],
      warnings: [sourceUnavailable.Kyverno],
      events: []
    };
  }

  const warnings: string[] = [];
  let reports = 0;
  let failures = 0;
  const events: RuntimeStatusSnapshot["timelineEvents"] = [];

  for (const environment of input.environments) {
    const namespace = namespaceFor(input.serviceId, environment);

    try {
      const reportList = await kubeGet<KubernetesList<{ metadata?: KubernetesMetadata; summary?: { fail?: number; pass?: number; warn?: number; error?: number } }>>(`/apis/wgpolicyk8s.io/v1alpha2/namespaces/${namespace}/policyreports`);

      for (const report of reportList?.items ?? []) {
        reports += 1;
        failures += report.summary?.fail ?? 0;
        events.push({
          id: `${input.serviceId}-kyverno-${environment}-${report.metadata?.name ?? reports}`,
          label: "Kyverno PolicyReport observed",
          detail: `${report.metadata?.name ?? "PolicyReport"} fail=${report.summary?.fail ?? 0}, warn=${report.summary?.warn ?? 0}, pass=${report.summary?.pass ?? 0}`,
          source: "Kyverno",
          status: (report.summary?.fail ?? 0) > 0 ? "warning" : "succeeded",
          tone: (report.summary?.fail ?? 0) > 0 ? "warning" : "success",
          time: report.metadata?.creationTimestamp ?? new Date().toISOString()
        });
      }
    } catch (error) {
      warnings.push(`Kyverno PolicyReports unavailable in ${namespace}: ${error instanceof Error ? error.message : "Unknown Kyverno error."}`);
    }
  }

  if (reports === 0 && warnings.length) {
    return {
      signals: [unavailable("PolicyReports", "Kyverno", warnings.join(" ")), unavailable("Violations", "Kyverno", warnings.join(" "))],
      warnings,
      events
    };
  }

  return {
    signals: [
      signal("PolicyReports", String(reports), "Kyverno"),
      signal("Violations", String(failures), "Kyverno")
    ],
    warnings,
    events
  };
}

function policySeverity(value?: string): PolicySeverity {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "medium";
}

function environmentFromNamespace(namespace?: string): EnvironmentName {
  if (namespace?.endsWith("-prod")) {
    return "prod";
  }

  if (namespace?.endsWith("-stage")) {
    return "stage";
  }

  return "dev";
}

function serviceFromNamespace(namespace?: string) {
  return namespace?.replace(/-(dev|stage|prod)$/, "") || "unknown-service";
}

function resourceName(result: PolicyReportResult, report: PolicyReport) {
  const resource = result.resources?.[0] ?? report.scope;
  const kind = resource?.kind ?? "Resource";
  const name = resource?.name ?? report.metadata?.name ?? "unknown";

  return `${kind}/${name}`;
}

function policyReportViolation(report: PolicyReport, result: PolicyReportResult, index: number): RuntimePolicyViolation {
  const namespace = result.resources?.[0]?.namespace ?? report.scope?.namespace ?? report.metadata?.namespace ?? "cluster";
  const serviceId = serviceFromNamespace(namespace);
  const status = result.result === "error" ? "error" : result.result === "warn" ? "warning" : "open";

  return {
    id: `${namespace}-${report.metadata?.name ?? "policyreport"}-${index}`,
    policy: result.policy ?? result.rule ?? report.metadata?.name ?? "PolicyReport finding",
    serviceId,
    service: serviceId,
    team: "Unknown",
    environment: environmentFromNamespace(namespace),
    severity: policySeverity(result.severity),
    status,
    resource: resourceName(result, report),
    namespace,
    lastSeenAt: report.metadata?.creationTimestamp ?? "Unknown",
    remediation: result.message ?? "Review the reported policy finding in Kyverno.",
    auditEvent: result.source ?? "PolicyReport",
    source: "Kyverno"
  };
}

export async function getGovernanceRuntimeSnapshot(): Promise<GovernanceRuntimeSnapshot> {
  if (!kubernetesConfig()) {
    return {
      source: "Kyverno",
      attempted: false,
      warning: sourceUnavailable.Kyverno,
      policyReportCount: 0,
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      errorCount: 0,
      violations: []
    };
  }

  try {
    const reportList = await kubeGet<KubernetesList<PolicyReport>>("/apis/wgpolicyk8s.io/v1alpha2/policyreports");
    const reports = reportList?.items ?? [];
    const violations = reports.flatMap((report) =>
      (report.results ?? [])
        .filter((result) => ["fail", "warn", "error"].includes(result.result ?? ""))
        .map((result, index) => policyReportViolation(report, result, index))
    );

    return {
      source: "Kyverno",
      attempted: true,
      policyReportCount: reports.length,
      passCount: reports.reduce((sum, report) => sum + (report.summary?.pass ?? 0), 0),
      warnCount: reports.reduce((sum, report) => sum + (report.summary?.warn ?? 0), 0),
      failCount: reports.reduce((sum, report) => sum + (report.summary?.fail ?? 0), 0),
      errorCount: reports.reduce((sum, report) => sum + (report.summary?.error ?? 0), 0),
      violations
    };
  } catch (error) {
    return {
      source: "Kyverno",
      attempted: true,
      warning: `Kyverno PolicyReports unavailable: ${error instanceof Error ? error.message : "Unknown Kyverno error."}`,
      policyReportCount: 0,
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      errorCount: 0,
      violations: []
    };
  }
}

export async function getRuntimeStatus(input: RuntimeServiceInput): Promise<RuntimeStatusSnapshot> {
  const [github, argocd, cluster, governance] = await Promise.all([
    getGitHubSignals(input),
    getArgoSignals(input),
    getClusterInventory(input),
    getGovernanceSignals(input)
  ]);

  return {
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    generatedAt: new Date().toISOString(),
    warnings: [...github.warnings, ...argocd.warnings, ...cluster.warnings, ...governance.warnings],
    github: github.signals,
    argocd: argocd.signals,
    rollout: cluster.rollout,
    hpa: cluster.hpa,
    pods: cluster.pods,
    governance: governance.signals,
    resourceInventory: cluster.inventory,
    timelineEvents: [...github.events, ...argocd.events, ...cluster.events, ...governance.events].sort((a, b) => b.time.localeCompare(a.time))
  };
}

function pluralForClaimKind(kind: string) {
  const map: Record<string, string> = {
    PostgreSQLInstance: "postgresqlinstances",
    RedisInstance: "redisinstances",
    ObjectBucket: "objectbuckets",
    MessageQueue: "messagequeues",
    DynamoDBTable: "dynamodbtables"
  };

  return map[kind] ?? `${kind.toLowerCase()}s`;
}

export async function getProvisionRuntimeOverlay(input: {
  repositoryName: string;
  environment: EnvironmentName;
  namespace: string;
  claimKind: string;
  claimName: string;
  prNumber?: number | null;
  gitOpsStatus: string;
  provisioningStatus: string;
  clusterStatus: string;
}): Promise<ProvisionRuntimeOverlay> {
  const warnings: string[] = [];
  let gitOpsStatus = input.gitOpsStatus;
  let provisioningStatus = input.provisioningStatus;
  let clusterStatus = input.clusterStatus;
  let gitOpsSource: RuntimeSource = "GitHub";
  let provisioningSource: RuntimeSource = "ArgoCD";
  let clusterSource: RuntimeSource = "Crossplane";

  if (!argoConfig()) {
    warnings.push(sourceUnavailable.ArgoCD);
    provisioningStatus = "Integration not configured";
  } else {
    try {
      const app = await fetchArgoApplication(`${input.repositoryName}-${input.environment}`);
      const sync = app?.status?.sync?.status;
      const health = app?.status?.health?.status;

      if (sync || health) {
        gitOpsStatus = sync ? `ArgoCD ${sync}` : gitOpsStatus;
        provisioningStatus = health ? `ArgoCD ${health}` : provisioningStatus;
      }
    } catch (error) {
      warnings.push(`ArgoCD provision status unavailable: ${error instanceof Error ? error.message : "Unknown ArgoCD error."}`);
      provisioningStatus = "No ArgoCD application found";
    }
  }

  if (!kubernetesConfig()) {
    warnings.push(sourceUnavailable.Crossplane);
    clusterStatus = "Integration not configured";
  } else {
    try {
      const plural = pluralForClaimKind(input.claimKind);
      const claim = await kubeGet<KubernetesObject>(`/apis/platform.ohanyere.com/v1alpha1/namespaces/${input.namespace}/${plural}/${input.claimName}`);
      const ready = claim?.status?.conditions?.find((condition) => condition.type === "Ready");

      if (ready?.status === "True") {
        clusterStatus = "Ready";
        provisioningStatus = "Ready";
      } else if (ready?.status === "False") {
        clusterStatus = ready.reason ?? "Waiting";
        provisioningStatus = "Provisioning";
      } else if (claim) {
        clusterStatus = "Claim Accepted";
        provisioningStatus = "Provisioning";
      }
    } catch (error) {
      warnings.push(`Crossplane claim status unavailable: ${error instanceof Error ? error.message : "Unknown Crossplane error."}`);
      clusterStatus = "No Crossplane claims found";
    }
  }

  return {
    gitOpsStatus,
    gitOpsSource,
    provisioningStatus,
    provisioningSource,
    clusterStatus,
    clusterSource,
    warnings
  };
}
