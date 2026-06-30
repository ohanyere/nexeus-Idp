import type { EnvironmentName, StatusTone } from "@/lib/mock-data";
import { deployments, getServiceById, getServiceResources } from "@/lib/mock-data";

export type KubernetesResourceKind =
  | "Pod"
  | "Rollout"
  | "HPA"
  | "Service"
  | "NetworkPolicy"
  | "PodDisruptionBudget"
  | "ResourceQuota"
  | "Event";

export type KubernetesResourceStatus = "Healthy" | "Progressing" | "Pending" | "Failed" | "Unknown";

export type ServiceKubernetesResource = {
  id: string;
  serviceId: string;
  name: string;
  namespace: string;
  environment: EnvironmentName;
  kind: KubernetesResourceKind;
  status: KubernetesResourceStatus;
  tone: StatusTone;
  age: string;
  summary: string;
  desired?: string;
  current?: string;
  lastUpdated: string;
};

export type ServiceResourceInventory = {
  serviceId: string;
  generatedAt: string;
  resources: ServiceKubernetesResource[];
};

const environments: EnvironmentName[] = ["dev", "stage", "prod"];
const kindOrder: KubernetesResourceKind[] = ["Pod", "Rollout", "HPA", "Service", "NetworkPolicy", "PodDisruptionBudget", "ResourceQuota", "Event"];

export function getServiceResourceInventory(serviceId: string): ServiceResourceInventory {
  const service = getServiceById(serviceId);
  const resources = service ? environments.flatMap((environment) => createEnvironmentResources(serviceId, service.name, environment)) : [];

  return {
    serviceId,
    generatedAt: "Mocked at 10:32",
    resources
  };
}

export function kubernetesResourceKinds() {
  return kindOrder;
}

export function kubernetesResourceStatusTone(status: KubernetesResourceStatus): StatusTone {
  if (status === "Healthy") {
    return "success";
  }

  if (status === "Progressing" || status === "Pending") {
    return "warning";
  }

  if (status === "Failed") {
    return "danger";
  }

  return "neutral";
}

function createEnvironmentResources(serviceId: string, serviceName: string, environment: EnvironmentName) {
  const deployment = deployments.find((item) => item.serviceId === serviceId && item.environment === environment);
  const provisioned = getServiceResources(serviceId).filter((resource) => resource.environment === environment);
  const namespace = `${serviceId}-${environment}`;
  const rolloutStatus = statusFromText(deployment?.rolloutStatus ?? (environment === "prod" ? "completed" : "pending"));
  const podStatus = statusFromText(deployment?.status ?? (environment === "dev" ? "Progressing" : "Healthy"));
  const eventStatus = rolloutStatus === "Failed" ? "Failed" : rolloutStatus === "Progressing" ? "Progressing" : "Healthy";
  const podCount = environment === "prod" ? "3/3" : environment === "stage" ? "2/2" : "1/1";

  return [
    resource(serviceId, environment, "Pod", `${serviceId}-${environment}-7f9d8`, namespace, podStatus, "Workload pods owned by the service selector.", podCount, podCount, deployment?.deployedAt ?? "Pending"),
    resource(serviceId, environment, "Rollout", `${serviceId}-${environment}`, namespace, rolloutStatus, `${deployment?.rolloutStrategy ?? "standard"} rollout controller state.`, deployment?.version ?? "desired image pending", deployment?.rolloutStatus ?? "waiting", deployment?.deployedAt ?? "Pending"),
    resource(serviceId, environment, "HPA", `${serviceId}-${environment}`, namespace, environment === "prod" ? "Healthy" : "Pending", "Autoscaling policy and current replica window.", environment === "prod" ? "2-8 replicas" : "1-3 replicas", environment === "prod" ? "3 replicas" : "1 replica", "5 min ago"),
    resource(serviceId, environment, "Service", `${serviceId}`, namespace, "Healthy", "ClusterIP service routing traffic to ready pods.", "port 80", "endpoints ready", "4 min ago"),
    resource(serviceId, environment, "NetworkPolicy", `${serviceId}-default-deny`, namespace, "Healthy", "Ingress and egress boundaries for service traffic.", "default deny", "enforced", "9 min ago"),
    resource(serviceId, environment, "PodDisruptionBudget", `${serviceId}`, namespace, rolloutStatus === "Failed" ? "Pending" : "Healthy", "Availability budget for voluntary disruptions.", environment === "prod" ? "minAvailable 2" : "minAvailable 1", "satisfied", "11 min ago"),
    resource(serviceId, environment, "ResourceQuota", `${serviceId}-quota`, namespace, quotaStatus(serviceId, environment, provisioned.length), "CPU, memory, object, and storage guardrails.", "within quota", provisioned.length ? `${provisioned.length} claims linked` : "base quota only", "12 min ago"),
    resource(serviceId, environment, "Event", `${serviceId}-${environment}-events`, namespace, eventStatus, eventSummary(serviceName, environment, deployment?.status), "latest event", deployment?.status ?? "No deployment recorded", deployment?.deployedAt ?? "Pending")
  ];
}

function resource(
  serviceId: string,
  environment: EnvironmentName,
  kind: KubernetesResourceKind,
  name: string,
  namespace: string,
  status: KubernetesResourceStatus,
  summary: string,
  desired: string,
  current: string,
  lastUpdated: string
): ServiceKubernetesResource {
  return {
    id: `${serviceId}-${environment}-${kind}-${name}`,
    serviceId,
    name,
    namespace,
    environment,
    kind,
    status,
    tone: kubernetesResourceStatusTone(status),
    age: environment === "prod" ? "14d" : environment === "stage" ? "5d" : "2d",
    summary,
    desired,
    current,
    lastUpdated
  };
}

function statusFromText(text: string): KubernetesResourceStatus {
  const lower = text.toLowerCase();

  if (lower.includes("failed") || lower.includes("rejected")) {
    return "Failed";
  }

  if (lower.includes("building") || lower.includes("running") || lower.includes("progress") || lower.includes("canary")) {
    return "Progressing";
  }

  if (lower.includes("pending") || lower.includes("prepared") || lower.includes("waiting")) {
    return "Pending";
  }

  if (lower.includes("unknown")) {
    return "Unknown";
  }

  return "Healthy";
}

function quotaStatus(serviceId: string, environment: EnvironmentName, claimCount: number): KubernetesResourceStatus {
  if (serviceId === "orders-worker" && environment === "stage") {
    return "Failed";
  }

  if (claimCount === 0 && environment !== "dev") {
    return "Unknown";
  }

  return "Healthy";
}

function eventSummary(serviceName: string, environment: EnvironmentName, status?: string) {
  if (!status) {
    return `${serviceName} ${environment} has no recent deployment event in the mock snapshot.`;
  }

  return `${serviceName} ${environment} latest event: ${status}.`;
}
