import type { EnvironmentName, StatusTone } from "@/lib/mock-data";
import { services, teams } from "@/lib/mock-data";

export type InfrastructureProvider = "Crossplane" | "Terraform Cloud" | "AWS Service Catalog" | "Kubernetes";
export type InfrastructureResourceType =
  | "PostgreSQL"
  | "Redis"
  | "MySQL"
  | "MongoDB"
  | "Kafka"
  | "RabbitMQ"
  | "S3 Bucket"
  | "Object Storage"
  | "SQS Queue"
  | "SNS Topic"
  | "DynamoDB Table"
  | "RDS Instance"
  | "Namespace"
  | "Secret"
  | "ConfigMap"
  | "Persistent Volume"
  | "DNS Record";
export type ProvisionRequestStatus =
  | "Requested"
  | "PR Created"
  | "Awaiting Approval"
  | "Merged"
  | "ArgoCD Syncing"
  | "Claim Accepted"
  | "Provisioning"
  | "Ready"
  | "Failed"
  | "Pending"
  | "Waiting Approval"
  | "Approved"
  | "Rejected"
  | "Cancelled";
export type ProvisionedResourceStatus = "Ready" | "Provisioning" | "Failed" | "Pending" | "Drift";
export type GitOpsResourceId = "postgresql" | "redis" | "s3-bucket" | "sqs-queue" | "dynamodb-table";

export type ResourceCatalogItem = {
  id: string;
  gitOpsResourceId?: GitOpsResourceId;
  type: InfrastructureResourceType;
  name: string;
  description: string;
  owner: string;
  approvalRequired: boolean;
  estimatedMonthlyCost: string;
  supportedEnvironments: EnvironmentName[];
  provider: InfrastructureProvider;
  parameters: string[];
  useCases: string[];
  dependencies: string[];
};

export const gitOpsSupportedResourceIds: GitOpsResourceId[] = ["postgresql", "redis", "s3-bucket", "sqs-queue", "dynamodb-table"];

export type ProvisionRequest = {
  id: string;
  requester: string;
  approver: string;
  team: string;
  teamId: string;
  environment: EnvironmentName;
  resourceType: InfrastructureResourceType;
  resourceName: string;
  status: ProvisionRequestStatus;
  tone: StatusTone;
  submittedAt: string;
  timeline: Array<{ event: string; time: string; actor: string; status: string; tone: StatusTone }>;
};

export type ProvisionedInfrastructureResource = {
  id: string;
  name: string;
  type: InfrastructureResourceType;
  team: string;
  teamId: string;
  owner: string;
  environment: EnvironmentName;
  region: string;
  provider: InfrastructureProvider;
  status: ProvisionedResourceStatus;
  tone: StatusTone;
  age: string;
  estimatedCost: string;
  linkedServiceIds: string[];
  configuration: Record<string, string>;
  labels: Record<string, string>;
  events: string[];
  audit: Array<{ event: string; actor: string; time: string; tone: StatusTone }>;
};

export type ResourceTemplate = {
  id: string;
  name: string;
  description: string;
  resourceType: InfrastructureResourceType;
  parameters: string[];
  supportedEnvironments: EnvironmentName[];
  estimatedCost: string;
};

const envs: EnvironmentName[] = ["dev", "stage", "prod"];

export const resourceCatalog: ResourceCatalogItem[] = [
  item("postgresql", "PostgreSQL", "Managed PostgreSQL", "Relational database claim with backups, monitoring, and network policy.", "Data Platform", true, "$180", ["dev", "stage", "prod"], "Crossplane", ["region", "storageGB", "instanceClass", "deletionPolicy"], ["transactional API state", "ledger storage"], ["namespace", "secret"], "postgresql"),
  item("redis", "Redis", "Managed Redis", "Low-latency cache with optional persistence and HA.", "Runtime Platform", false, "$95", envs, "Crossplane", ["region", "nodeType", "numCacheNodes", "deletionPolicy"], ["session cache", "idempotency keys"], ["namespace", "secret"], "redis"),
  item("mysql", "MySQL", "Managed MySQL", "Relational database for services that need MySQL compatibility.", "Data Platform", true, "$165", envs, "Crossplane", ["version", "storage", "backup", "region"], ["legacy service storage"], ["namespace"]),
  item("mongodb", "MongoDB", "Managed MongoDB", "Document database with team-scoped credentials.", "Data Platform", true, "$210", ["stage", "prod"], "Terraform Cloud", ["version", "storage", "replicas", "region"], ["catalog documents"], ["secret"]),
  item("kafka", "Kafka", "Kafka Topic", "Event streaming topic with retention and schema ownership.", "Streaming Platform", true, "$140", ["stage", "prod"], "Crossplane", ["partitions", "retention", "schema policy"], ["domain events", "async workflows"], ["namespace"]),
  item("rabbitmq", "RabbitMQ", "RabbitMQ Queue", "AMQP queue with dead-letter and retry settings.", "Streaming Platform", false, "$80", envs, "Crossplane", ["queue name", "dlq", "retention"], ["worker queue"], ["secret"]),
  item("s3-bucket", "S3 Bucket", "S3 Bucket", "Object bucket with encryption, lifecycle, and cost tags.", "Cloud Platform", false, "$45", envs, "Crossplane", ["region", "versioning", "deletionPolicy"], ["assets", "exports", "reports"], ["namespace", "secret"], "s3-bucket"),
  item("object-storage", "Object Storage", "Object Storage", "Provider-neutral object storage claim.", "Cloud Platform", false, "$40", envs, "Crossplane", ["bucket", "retention", "region"], ["portable storage"], ["secret"]),
  item("sqs-queue", "SQS Queue", "SQS Queue", "AWS queue with retry, visibility timeout, and DLQ.", "Cloud Platform", false, "$30", envs, "Crossplane", ["region", "fifo", "visibilityTimeoutSeconds", "deletionPolicy"], ["worker queue"], ["namespace", "secret"], "sqs-queue"),
  item("sns-topic", "SNS Topic", "SNS Topic", "Pub/sub topic with team-owned subscriptions.", "Cloud Platform", false, "$25", envs, "AWS Service Catalog", ["topic", "subscriptions", "filters"], ["notifications"], ["iam role"]),
  item("dynamodb-table", "DynamoDB Table", "DynamoDB Table", "Key-value table claim with on-demand billing for service state.", "Data Platform", false, "$60", envs, "Crossplane", ["region", "hashKey", "billingMode", "deletionPolicy"], ["service state", "idempotency store"], ["namespace", "secret"], "dynamodb-table"),
  item("rds-instance", "RDS Instance", "RDS Instance", "Dedicated RDS instance for regulated workloads.", "Data Platform", true, "$420", ["prod"], "Terraform Cloud", ["engine", "size", "multi-az", "backup"], ["tier 0 database"], ["vpc", "secret"]),
  item("namespace", "Namespace", "Kubernetes Namespace", "Isolated Kubernetes namespace with quotas and baseline policy.", "Platform Engineering", false, "$0", envs, "Kubernetes", ["name", "labels", "quota"], ["service boundary"], ["rbac"]),
  item("secret", "Secret", "Secret", "Kubernetes secret placeholder for future external secret integration.", "Security Platform", true, "$0", envs, "Kubernetes", ["keys", "rotation", "owner"], ["application credentials"], ["namespace"]),
  item("configmap", "ConfigMap", "ConfigMap", "Runtime configuration map with ownership metadata.", "Platform Engineering", false, "$0", envs, "Kubernetes", ["keys", "labels"], ["app configuration"], ["namespace"]),
  item("persistent-volume", "Persistent Volume", "Persistent Volume", "Persistent storage claim for stateful workloads.", "Runtime Platform", true, "$75", ["stage", "prod"], "Kubernetes", ["size", "class", "backup"], ["stateful workload"], ["namespace"]),
  item("dns-record", "DNS Record", "DNS Record", "Internal or external DNS record request.", "Network Platform", true, "$10", ["stage", "prod"], "Terraform Cloud", ["hostname", "target", "ttl"], ["service endpoint"], ["load balancer"])
];

export const provisionRequests: ProvisionRequest[] = [
  request("req-payments-redis", "Maya Chen", "Jordan Lee", "payments", "prod", "Redis", "payments-auth-cache", "Ready", "2026-06-11 08:10"),
  request("req-checkout-kafka", "Andre Patel", "Jordan Lee", "commerce", "stage", "Kafka", "checkout-events", "Waiting Approval", "2026-06-11 09:02"),
  request("req-catalog-s3", "Sam Rivera", "Jordan Lee", "commerce", "prod", "S3 Bucket", "product-assets", "Provisioning", "2026-06-10 16:20"),
  request("req-orders-labels", "Nora Ali", "Policy engine", "commerce", "stage", "Namespace", "orders-worker-stage", "Failed", "2026-06-10 14:03"),
  request("req-idp-config", "Avery Morgan", "Avery Morgan", "developer-experience", "dev", "ConfigMap", "idp-portal-env", "Approved", "2026-06-11 10:20")
];

export const provisionedInfrastructureResources: ProvisionedInfrastructureResource[] = [
  provisioned("infra-payments-postgres", "payments-postgres", "PostgreSQL", "payments", "Maya Chen", "prod", "us-east-1", "Crossplane", "Ready", "$180", ["payments-api"]),
  provisioned("infra-payments-redis", "payments-auth-cache", "Redis", "payments", "Maya Chen", "prod", "us-east-1", "Crossplane", "Ready", "$95", ["payments-api"]),
  provisioned("infra-checkout-queue", "checkout-events", "Kafka", "commerce", "Andre Patel", "stage", "us-east-1", "Crossplane", "Provisioning", "$140", ["checkout-service"]),
  provisioned("infra-catalog-assets", "product-assets", "S3 Bucket", "commerce", "Sam Rivera", "prod", "us-east-1", "AWS Service Catalog", "Ready", "$45", ["catalog-api"]),
  provisioned("infra-orders-namespace", "orders-worker-stage", "Namespace", "commerce", "Nora Ali", "stage", "cluster-local", "Kubernetes", "Failed", "$0", ["orders-worker"]),
  provisioned("infra-idp-config", "idp-portal-env", "ConfigMap", "developer-experience", "Avery Morgan", "dev", "cluster-local", "Kubernetes", "Pending", "$0", ["idp-portal"])
];

export const resourceTemplates: ResourceTemplate[] = [
  template("small-redis", "Small Redis", "Single-node Redis for development and low-volume services.", "Redis", ["memory: 512Mi", "persistence: false"], ["dev", "stage"], "$35"),
  template("ha-redis", "HA Redis", "Highly available Redis with persistence and backup.", "Redis", ["memory: 4Gi", "replicas: 3", "backup: daily"], ["stage", "prod"], "$220"),
  template("dev-postgres", "Development PostgreSQL", "Small PostgreSQL database for dev/test services.", "PostgreSQL", ["storage: 20Gi", "backup: none"], ["dev"], "$60"),
  template("prod-postgres", "Production PostgreSQL", "Production PostgreSQL with backup and monitoring.", "PostgreSQL", ["storage: 200Gi", "backup: daily", "multi-az: true"], ["prod"], "$420"),
  template("namespace", "Namespace", "Namespace with quota, baseline policies, and labels.", "Namespace", ["quota: standard", "network policy: default deny"], envs, "$0"),
  template("kafka-cluster", "Kafka Cluster", "Managed Kafka topic and schema ownership template.", "Kafka", ["partitions: 6", "retention: 7d"], ["stage", "prod"], "$280"),
  template("s3-bucket", "S3 Bucket", "Encrypted S3 bucket with lifecycle and tags.", "S3 Bucket", ["encryption: AES256", "lifecycle: 90d"], envs, "$45")
];

export function getResourceCatalogItem(resourceId: string) {
  return resourceCatalog.find((resource) => resource.id === resourceId);
}

export function getProvisionedInfrastructureResource(resourceId: string) {
  return provisionedInfrastructureResources.find((resource) => resource.id === resourceId);
}

export function getProvisionedResourcesForService(serviceId: string) {
  return provisionedInfrastructureResources.filter((resource) => resource.linkedServiceIds.includes(serviceId));
}

function item(id: string, type: InfrastructureResourceType, name: string, description: string, owner: string, approvalRequired: boolean, estimatedMonthlyCost: string, supportedEnvironments: EnvironmentName[], provider: InfrastructureProvider, parameters: string[], useCases: string[], dependencies: string[], gitOpsResourceId?: GitOpsResourceId): ResourceCatalogItem {
  return { id, gitOpsResourceId, type, name, description, owner, approvalRequired, estimatedMonthlyCost, supportedEnvironments, provider, parameters, useCases, dependencies };
}

function request(id: string, requester: string, approver: string, teamId: string, environment: EnvironmentName, resourceType: InfrastructureResourceType, resourceName: string, status: ProvisionRequestStatus, submittedAt: string): ProvisionRequest {
  const team = teams.find((candidate) => candidate.id === teamId);
  const tone = statusTone(status);
  return {
    id,
    requester,
    approver,
    team: team?.name ?? teamId,
    teamId,
    environment,
    resourceType,
    resourceName,
    status,
    tone,
    submittedAt,
    timeline: [
      { event: "Request Created", time: submittedAt, actor: requester, status: "submitted", tone: "neutral" },
      { event: "Approval Requested", time: "Pending", actor: "Nexus Platform", status: status === "Pending" ? "pending" : "sent", tone: status === "Pending" ? "warning" : "info" },
      { event: status === "Rejected" ? "Rejected" : "Approved", time: status === "Waiting Approval" ? "Pending" : submittedAt, actor: approver, status: status.toLowerCase(), tone },
      { event: status === "Failed" ? "Provision Failed" : "Provision Complete", time: status === "Ready" ? submittedAt : "Pending", actor: "Platform automation", status: status.toLowerCase(), tone }
    ]
  };
}

function provisioned(id: string, name: string, type: InfrastructureResourceType, teamId: string, owner: string, environment: EnvironmentName, region: string, provider: InfrastructureProvider, status: ProvisionedResourceStatus, estimatedCost: string, linkedServiceIds: string[]): ProvisionedInfrastructureResource {
  const team = teams.find((candidate) => candidate.id === teamId);
  return {
    id,
    name,
    type,
    team: team?.name ?? teamId,
    teamId,
    owner,
    environment,
    region,
    provider,
    status,
    tone: statusTone(status),
    age: environment === "prod" ? "14d" : environment === "stage" ? "5d" : "2d",
    estimatedCost,
    linkedServiceIds,
    configuration: { size: type.includes("Redis") ? "2Gi" : "standard", backup: environment === "prod" ? "daily" : "none", region },
    labels: { "platform.io/team": teamId, "platform.io/environment": environment, "platform.io/owner": owner },
    events: [`${name} request reconciled`, `${provider} mock claim observed`, `${status} status recorded`],
    audit: [
      { event: "Request Created", actor: owner, time: "2026-06-11 08:10", tone: "neutral" },
      { event: "Approved", actor: "Jordan Lee", time: "2026-06-11 08:18", tone: "success" },
      { event: status === "Failed" ? "Provision Failed" : "Provision Complete", actor: "Platform automation", time: "2026-06-11 08:25", tone: statusTone(status) }
    ]
  };
}

function template(id: string, name: string, description: string, resourceType: InfrastructureResourceType, parameters: string[], supportedEnvironments: EnvironmentName[], estimatedCost: string): ResourceTemplate {
  return { id, name, description, resourceType, parameters, supportedEnvironments, estimatedCost };
}

function statusTone(status: ProvisionRequestStatus | ProvisionedResourceStatus): StatusTone {
  if (["Ready", "Approved", "Merged", "Claim Accepted"].includes(status)) {
    return "success";
  }
  if (["Failed", "Rejected"].includes(status)) {
    return "danger";
  }
  if (["Waiting Approval", "Pending", "Provisioning", "Cancelled", "Requested", "PR Created", "Awaiting Approval", "ArgoCD Syncing"].includes(status)) {
    return "warning";
  }
  if (status === "Drift") {
    return "drift";
  }
  return "neutral";
}
