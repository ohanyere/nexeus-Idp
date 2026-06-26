import {
  Activity,
  Boxes,
  CircleDollarSign,
  Cloud,
  Database,
  FileText,
  Gauge,
  GitBranch,
  GitCompareArrows,
  HeartPulse,
  LayoutDashboard,
  LibraryBig,
  LockKeyhole,
  PackageCheck,
  RotateCw,
  Rocket,
  ScrollText,
  ServerCog,
  Settings,
  ShieldCheck,
  ShipWheel,
  SquareStack,
  Users,
  Workflow,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "drift" | "neutral";
export type EnvironmentName = "dev" | "stage" | "prod";
export type DeploymentType = "direct deploy" | "promotion from dev" | "promotion from stage" | "rollback";
export type RolloutStrategy = "standard" | "canary";
export type MaturityLevel = "basic" | "standard" | "production-ready";
export type Permission =
  | "create service"
  | "create resource"
  | "deploy to dev"
  | "deploy to stage"
  | "deploy to prod"
  | "approve production deployment"
  | "rollback deployment"
  | "view costs"
  | "manage policies"
  | "manage templates";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  group: "Platform" | "Catalog" | "Operations" | "Governance" | "Admin";
};

export type Service = {
  id: string;
  name: string;
  teamId: string;
  team: string;
  serviceOwner: string;
  ownerEmail: string;
  template: string;
  environment: EnvironmentName;
  environments: EnvironmentName[];
  healthStatus: string;
  healthTone: StatusTone;
  deploymentStatus: string;
  deploymentTone: StatusTone;
  currentVersion: string;
  monthlyCost: string;
  description: string;
  repository: string;
  documentation: {
    repository: string;
    runbook: string;
    apiDocs: string;
    eventDocs: string;
    owner: string;
  };
  platformContacts: string[];
  escalationContacts: string[];
  dependencies: Array<{ name: string; type: string; environment: EnvironmentName; health: string; tone: StatusTone }>;
};

export type DeploymentLogGroup = {
  title: string;
  lines: string[];
};

export type DeploymentRecord = {
  id: string;
  serviceId: string;
  service: string;
  version: string;
  environment: EnvironmentName;
  status: string;
  tone: StatusTone;
  commit: string;
  image: string;
  deployedBy: string;
  deployedAt: string;
  deploymentType: DeploymentType;
  rolloutStrategy: RolloutStrategy;
  githubActionsStatus: string;
  argoCdSyncStatus: string;
  rolloutStatus: string;
  healthChecks: Array<{ name: string; status: string; tone: StatusTone }>;
  timeline: Array<{ time: string; event: string; detail: string; tone: StatusTone }>;
  logs: {
    githubActions: DeploymentLogGroup;
    imageScan: DeploymentLogGroup;
    argoCd: DeploymentLogGroup;
    kubernetes: DeploymentLogGroup;
    kyverno: DeploymentLogGroup;
    argoRollouts: DeploymentLogGroup;
  };
  previousStableVersions: Array<{ version: string; commit: string; image: string; deployedAt: string }>;
};

export type MockRole = "Platform Admin" | "Team Lead" | "Developer" | "Viewer";

export type PromotionEnvironment = EnvironmentName;

export type EnvironmentPromotion = {
  serviceId: string;
  environments: Array<{
    environment: PromotionEnvironment;
    version: string;
    status: string;
    tone: StatusTone;
    promotionEligibility: string;
    requiredApproval: string;
    approvedBy: string;
    promotedAt: string;
  }>;
  history: Array<{ from: string; to: string; version: string; status: string; approvedBy: string; promotedAt: string }>;
};

export type Team = {
  id: string;
  name: string;
  members: number;
  ownership: string;
  monthlyCost: string;
  deploymentsThisMonth: number;
  incidentsThisMonth: number;
  policyViolations: number;
  platformContacts: string[];
  escalationContacts: string[];
};

export const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Platform" },
  { name: "Teams", href: "/teams", icon: Users, group: "Platform" },
  { name: "Services", href: "/services", icon: ServerCog, group: "Catalog" },
  { name: "Templates", href: "/templates", icon: LibraryBig, group: "Catalog" },
  { name: "Resources", href: "/resources", icon: Boxes, group: "Catalog" },
  { name: "Deployments", href: "/deployments", icon: Rocket, group: "Operations" },
  { name: "Platform Health", href: "/platform-health", icon: HeartPulse, group: "Operations" },
  { name: "Costs", href: "/costs", icon: CircleDollarSign, group: "Operations" },
  { name: "Scorecards", href: "/scorecards", icon: ShieldCheck, group: "Governance" },
  { name: "Drift Detection", href: "/drift", icon: GitCompareArrows, group: "Governance" },
  { name: "Disaster Recovery", href: "/disaster-recovery", icon: RotateCw, group: "Governance" },
  { name: "Governance", href: "/governance", icon: ShieldCheck, group: "Governance" },
  { name: "Audit Logs", href: "/audit-logs", icon: ScrollText, group: "Admin" },
  { name: "Settings", href: "/settings", icon: Settings, group: "Admin" }
];

export const mockTenantTeams = [
  { id: "platform-team", name: "Platform Team", tenant: "Senior Platform Demo", scope: "All services, policies, templates, and environments" },
  { id: "payments-team", name: "Payments Team", tenant: "Senior Platform Demo", scope: "Payments services, payment resources, and production approvals" },
  { id: "inventory-team", name: "Inventory Team", tenant: "Senior Platform Demo", scope: "Catalog and inventory service subset" },
  { id: "growth-team", name: "Growth Team", tenant: "Senior Platform Demo", scope: "Experiment, frontend, and customer growth services" }
];

export const mockRoles: MockRole[] = ["Platform Admin", "Team Lead", "Developer", "Viewer"];

export const rbacPermissions: Permission[] = [
  "create service",
  "create resource",
  "deploy to dev",
  "deploy to stage",
  "deploy to prod",
  "approve production deployment",
  "rollback deployment",
  "view costs",
  "manage policies",
  "manage templates"
];

export const rolePermissions: Record<MockRole, Permission[]> = {
  "Platform Admin": rbacPermissions,
  "Team Lead": [
    "create service",
    "create resource",
    "deploy to dev",
    "deploy to stage",
    "approve production deployment",
    "rollback deployment",
    "view costs"
  ],
  Developer: ["create service", "deploy to dev", "deploy to stage"],
  Viewer: ["view costs"]
};

export const accessControlUsers = [
  { name: "Avery Morgan", email: "avery.morgan@example.com", role: "Platform Admin", team: "Platform Team" },
  { name: "Maya Chen", email: "maya.chen@example.com", role: "Team Lead", team: "Payments Team" },
  { name: "Nora Ali", email: "nora.ali@example.com", role: "Developer", team: "Inventory Team" },
  { name: "Sam Rivera", email: "sam.rivera@example.com", role: "Viewer", team: "Growth Team" }
];

export const services: Service[] = [
  {
    id: "payments-api",
    name: "Payments API",
    teamId: "payments",
    team: "Payments",
    serviceOwner: "Maya Chen",
    ownerEmail: "payments-platform@example.com",
    template: "Go API",
    environment: "prod",
    environments: ["dev", "stage", "prod"],
    healthStatus: "Healthy",
    healthTone: "success",
    deploymentStatus: "Deployed",
    deploymentTone: "success",
    currentVersion: "v1.18.4",
    monthlyCost: "$12,860",
    description: "Handles payment authorization, capture, refund orchestration, and provider webhooks.",
    repository: "github.com/acme/payments-api",
    documentation: {
      repository: "https://github.com/acme/payments-api",
      runbook: "https://docs.example.com/runbooks/payments-api",
      apiDocs: "https://docs.example.com/apis/payments-api",
      eventDocs: "https://docs.example.com/events/payment-events",
      owner: "Maya Chen"
    },
    platformContacts: ["platform-oncall@example.com", "payments-platform@example.com"],
    escalationContacts: ["maya.chen@example.com", "payments-leads@example.com"],
    dependencies: [
      { name: "payments-postgres", type: "database", environment: "prod", health: "Healthy", tone: "success" },
      { name: "payments-vault-path", type: "secret path", environment: "prod", health: "Healthy", tone: "success" },
      { name: "Checkout Service", type: "upstream caller", environment: "prod", health: "Degraded", tone: "warning" }
    ]
  },
  {
    id: "checkout-service",
    name: "Checkout Service",
    teamId: "commerce",
    team: "Commerce",
    serviceOwner: "Andre Patel",
    ownerEmail: "commerce-checkout@example.com",
    template: "Node.js API",
    environment: "prod",
    environments: ["dev", "stage", "prod"],
    healthStatus: "Degraded",
    healthTone: "warning",
    deploymentStatus: "Rollback ready",
    deploymentTone: "danger",
    currentVersion: "v2.7.3",
    monthlyCost: "$9,740",
    description: "Coordinates cart validation, order creation, payment initiation, and checkout completion.",
    repository: "github.com/acme/checkout-service",
    documentation: {
      repository: "https://github.com/acme/checkout-service",
      runbook: "https://docs.example.com/runbooks/checkout-service",
      apiDocs: "https://docs.example.com/apis/checkout-service",
      eventDocs: "https://docs.example.com/events/checkout-events",
      owner: "Andre Patel"
    },
    platformContacts: ["platform-oncall@example.com", "commerce-platform@example.com"],
    escalationContacts: ["andre.patel@example.com", "commerce-leads@example.com"],
    dependencies: [
      { name: "Payments API", type: "synchronous API", environment: "prod", health: "Healthy", tone: "success" },
      { name: "orders-postgres", type: "database", environment: "prod", health: "Healthy", tone: "success" },
      { name: "sqs-checkout-events", type: "queue", environment: "prod", health: "Healthy", tone: "success" },
      { name: "redis-checkout", type: "cache", environment: "prod", health: "Degraded", tone: "warning" }
    ]
  },
  {
    id: "catalog-api",
    name: "Catalog API",
    teamId: "commerce",
    team: "Commerce",
    serviceOwner: "Sam Rivera",
    ownerEmail: "commerce-catalog@example.com",
    template: "Python API",
    environment: "stage",
    environments: ["dev", "stage"],
    healthStatus: "Drift detected",
    healthTone: "drift",
    deploymentStatus: "Sync warning",
    deploymentTone: "drift",
    currentVersion: "v3.2.0",
    monthlyCost: "$8,680",
    description: "Serves product metadata, pricing references, category search, and merchandising context.",
    repository: "github.com/acme/catalog-api",
    documentation: {
      repository: "https://github.com/acme/catalog-api",
      runbook: "https://docs.example.com/runbooks/catalog-api",
      apiDocs: "https://docs.example.com/apis/catalog-api",
      eventDocs: "https://docs.example.com/events/catalog-events",
      owner: "Sam Rivera"
    },
    platformContacts: ["platform-oncall@example.com", "commerce-platform@example.com"],
    escalationContacts: ["sam.rivera@example.com", "commerce-leads@example.com"],
    dependencies: [
      { name: "catalog-cache", type: "cache", environment: "stage", health: "Provisioning", tone: "warning" },
      { name: "s3-product-assets", type: "object storage", environment: "prod", health: "Healthy", tone: "success" },
      { name: "Prometheus", type: "metrics", environment: "stage", health: "Healthy", tone: "success" }
    ]
  },
  {
    id: "idp-portal",
    name: "IDP Portal",
    teamId: "developer-experience",
    team: "Developer Experience",
    serviceOwner: "Avery Morgan",
    ownerEmail: "devex@example.com",
    template: "Next.js Frontend",
    environment: "dev",
    environments: ["dev"],
    healthStatus: "Healthy",
    healthTone: "success",
    deploymentStatus: "Building",
    deploymentTone: "info",
    currentVersion: "v0.1.0",
    monthlyCost: "$3,220",
    description: "Developer portal for catalog, deployments, golden paths, governance, and operational visibility.",
    repository: "github.com/acme/idp-portal",
    documentation: {
      repository: "https://github.com/acme/idp-portal",
      runbook: "https://docs.example.com/runbooks/idp-portal",
      apiDocs: "https://docs.example.com/apis/idp-portal",
      eventDocs: "https://docs.example.com/events/idp-activity",
      owner: "Avery Morgan"
    },
    platformContacts: ["platform-oncall@example.com", "devex@example.com"],
    escalationContacts: ["avery.morgan@example.com", "devex-leads@example.com"],
    dependencies: [
      { name: "GitHub", type: "source control placeholder", environment: "dev", health: "Mocked", tone: "neutral" },
      { name: "idp-dev-namespace", type: "namespace", environment: "dev", health: "Healthy", tone: "success" }
    ]
  },
  {
    id: "orders-worker",
    name: "Orders Worker",
    teamId: "commerce",
    team: "Commerce",
    serviceOwner: "Nora Ali",
    ownerEmail: "commerce-orders@example.com",
    template: "Worker Service",
    environment: "stage",
    environments: ["dev", "stage"],
    healthStatus: "Failed",
    healthTone: "danger",
    deploymentStatus: "Failed",
    deploymentTone: "danger",
    currentVersion: "v0.9.6",
    monthlyCost: "$4,310",
    description: "Processes order lifecycle events and publishes downstream fulfillment signals.",
    repository: "github.com/acme/orders-worker",
    documentation: {
      repository: "https://github.com/acme/orders-worker",
      runbook: "https://docs.example.com/runbooks/orders-worker",
      apiDocs: "https://docs.example.com/apis/orders-worker",
      eventDocs: "https://docs.example.com/events/order-lifecycle",
      owner: "Nora Ali"
    },
    platformContacts: ["platform-oncall@example.com", "commerce-platform@example.com"],
    escalationContacts: ["nora.ali@example.com", "commerce-leads@example.com"],
    dependencies: [
      { name: "orders-postgres", type: "database", environment: "stage", health: "Healthy", tone: "success" },
      { name: "sqs-order-events", type: "queue", environment: "stage", health: "Healthy", tone: "success" },
      { name: "notification-worker", type: "downstream worker", environment: "stage", health: "Unknown", tone: "neutral" }
    ]
  }
];

export const dashboardStats = [
  { label: "Total services", value: String(services.length), detail: "Catalog entries in this tenant", tone: "neutral" as StatusTone },
  {
    label: "Healthy services",
    value: String(services.filter((service) => service.healthTone === "success").length),
    detail: "Mock health rollup",
    tone: "success" as StatusTone
  },
  {
    label: "Failed deployments",
    value: "1",
    detail: "Orders Worker stage",
    tone: "danger" as StatusTone
  },
  { label: "Monthly platform cost", value: "$38.8k", detail: "Mock team allocation", tone: "neutral" as StatusTone },
  { label: "Policy violations", value: "3", detail: "Mock governance findings", tone: "warning" as StatusTone }
];

export const activityItems = [
  {
    title: "service created",
    detail: "Orders Worker was created from the Worker Service golden path.",
    time: "31 min ago",
    tone: "neutral" as StatusTone
  },
  {
    title: "deployment triggered",
    detail: "Payments API v1.18.4 deployment was recorded for prod.",
    time: "12 min ago",
    tone: "success" as StatusTone
  },
  {
    title: "rollback requested",
    detail: "Checkout Service rollback target v2.7.1 is awaiting confirmation.",
    time: "2 hrs ago",
    tone: "danger" as StatusTone
  },
  {
    title: "policy violation detected",
    detail: "Orders Worker failed the required labels policy in stage.",
    time: "2 hrs ago",
    tone: "warning" as StatusTone
  },
  {
    title: "drift detected",
    detail: "Catalog API stage replicas differ from desired GitOps state.",
    time: "1 hr ago",
    tone: "warning" as StatusTone
  }
];

export const teams: Team[] = [
  {
    id: "platform-engineering",
    name: "Platform Engineering",
    members: 8,
    ownership: "Runtime, templates, governance",
    monthlyCost: "$9,310",
    deploymentsThisMonth: 18,
    incidentsThisMonth: 1,
    policyViolations: 0,
    platformContacts: ["platform-oncall@example.com", "runtime@example.com"],
    escalationContacts: ["platform-leads@example.com"]
  },
  {
    id: "payments",
    name: "Payments",
    members: 12,
    ownership: "Payments API, ledger, webhooks",
    monthlyCost: "$12,860",
    deploymentsThisMonth: 24,
    incidentsThisMonth: 0,
    policyViolations: 0,
    platformContacts: ["payments-platform@example.com", "platform-oncall@example.com"],
    escalationContacts: ["payments-leads@example.com", "maya.chen@example.com"]
  },
  {
    id: "commerce",
    name: "Commerce",
    members: 15,
    ownership: "Checkout, catalog, orders",
    monthlyCost: "$22,730",
    deploymentsThisMonth: 31,
    incidentsThisMonth: 2,
    policyViolations: 3,
    platformContacts: ["commerce-platform@example.com", "platform-oncall@example.com"],
    escalationContacts: ["commerce-leads@example.com", "andre.patel@example.com"]
  },
  {
    id: "developer-experience",
    name: "Developer Experience",
    members: 6,
    ownership: "IDP portal, docs, scorecards",
    monthlyCost: "$3,220",
    deploymentsThisMonth: 9,
    incidentsThisMonth: 0,
    policyViolations: 1,
    platformContacts: ["devex@example.com", "platform-oncall@example.com"],
    escalationContacts: ["devex-leads@example.com", "avery.morgan@example.com"]
  }
];

export const createServiceOptions = {
  environments: ["dev", "stage", "prod"],
  capabilities: [
    "PostgreSQL",
    "Redis",
    "S3 Bucket",
    "SQS Queue",
    "Monitoring",
    "Logs",
    "Canary Deployment",
    "API Docs",
    "Event Docs"
  ],
  repositoryVisibility: ["private", "public"],
  successSteps: [
    "Repository generated from template",
    "GitHub Actions pipeline created",
    "Docker Hub image path reserved",
    "ArgoCD application prepared",
    "Service added to catalog",
    "Audit event recorded"
  ]
};

export const templates = [
  {
    name: "Go API",
    version: "2.3.0",
    owner: "Platform Engineering",
    capabilities: ["REST API", "Dockerfile", "OpenAPI", "Prometheus metrics", "Argo Rollouts"],
    adoptionCount: 14
  },
  {
    name: "Node.js API",
    version: "1.8.2",
    owner: "Developer Experience",
    capabilities: ["REST API", "GitHub Actions", "Loki logging", "Vault path", "Kyverno baseline"],
    adoptionCount: 18
  },
  {
    name: "Python API",
    version: "1.5.1",
    owner: "Platform Engineering",
    capabilities: ["FastAPI", "OpenAPI", "Docker image", "Kubernetes probes", "Cost labels"],
    adoptionCount: 9
  },
  {
    name: "Next.js Frontend",
    version: "1.2.0",
    owner: "Developer Experience",
    capabilities: ["App Router", "Tailwind", "Static checks", "Preview environment", "Docs links"],
    adoptionCount: 6
  },
  {
    name: "Worker Service",
    version: "2.0.1",
    owner: "Platform Engineering",
    capabilities: ["Queue consumer", "Retry policy", "DLQ", "Prometheus metrics", "Runbook stub"],
    adoptionCount: 11
  }
];

export const deployments: DeploymentRecord[] = [
  {
    id: "dep-payments-api-prod-1184",
    serviceId: "payments-api",
    service: "Payments API",
    version: "v1.18.4",
    environment: "prod",
    status: "Healthy",
    tone: "success" as StatusTone,
    commit: "9ad31c2",
    image: "docker.io/kuberpull/payments-api:1.18.4",
    deployedBy: "Maya Chen",
    deployedAt: "2026-06-11 09:18",
    deploymentType: "promotion from stage",
    rolloutStrategy: "standard",
    githubActionsStatus: "succeeded",
    argoCdSyncStatus: "synced",
    rolloutStatus: "completed",
    healthChecks: [
      { name: "Readiness probes", status: "passing", tone: "success" },
      { name: "Error rate", status: "normal", tone: "success" },
      { name: "Latency SLO", status: "passing", tone: "success" }
    ],
    timeline: [
      { time: "09:05", event: "Build queued", detail: "GitHub Actions workflow started for 9ad31c2.", tone: "neutral" },
      { time: "09:10", event: "Image reserved", detail: "Docker Hub image path docker.io/kuberpull/payments-api:1.18.4 prepared.", tone: "success" },
      { time: "09:14", event: "ArgoCD sync", detail: "Mock sync completed for prod.", tone: "success" },
      { time: "09:18", event: "Deployment healthy", detail: "All health checks passed.", tone: "success" }
    ],
    logs: {
      githubActions: { title: "GitHub Actions build logs", lines: ["checkout completed", "npm test passed", "container build completed", "workflow concluded: success"] },
      imageScan: { title: "Docker image scan/sign logs", lines: ["image digest calculated", "critical vulnerabilities: 0", "signature placeholder recorded"] },
      argoCd: { title: "ArgoCD sync events", lines: ["app diff generated", "sync wave 0 completed", "health status: healthy"] },
      kubernetes: { title: "Kubernetes pod logs", lines: ["payments-api-7c9d ready", "readiness probe passing", "request latency p95 within target"] },
      kyverno: { title: "Kyverno policy validation logs", lines: ["resource limits required: pass", "signed images required: pass", "required labels: pass"] },
      argoRollouts: { title: "Argo Rollouts canary events", lines: ["standard rollout selected", "no canary analysis required", "rollout completed"] }
    },
    previousStableVersions: [
      { version: "v1.18.3", commit: "847be0a", image: "docker.io/kuberpull/payments-api:1.18.3", deployedAt: "2026-06-09 12:44" },
      { version: "v1.18.2", commit: "620fa90", image: "docker.io/kuberpull/payments-api:1.18.2", deployedAt: "2026-06-06 15:12" }
    ]
  },
  {
    id: "dep-checkout-prod-273",
    serviceId: "checkout-service",
    service: "Checkout Service",
    version: "v2.7.3",
    environment: "prod",
    status: "Rollback ready",
    tone: "danger" as StatusTone,
    commit: "fd80a11",
    image: "docker.io/kuberpull/checkout:2.7.3",
    deployedBy: "Andre Patel",
    deployedAt: "2026-06-11 07:04",
    deploymentType: "promotion from stage",
    rolloutStrategy: "canary",
    githubActionsStatus: "succeeded",
    argoCdSyncStatus: "synced",
    rolloutStatus: "canary paused",
    healthChecks: [
      { name: "Readiness probes", status: "flapping", tone: "warning" },
      { name: "Error rate", status: "elevated", tone: "danger" },
      { name: "Latency SLO", status: "degraded", tone: "warning" }
    ],
    timeline: [
      { time: "06:42", event: "Build completed", detail: "Image docker.io/kuberpull/checkout:2.7.3 built successfully.", tone: "success" },
      { time: "06:51", event: "Canary started", detail: "10% traffic shifted to v2.7.3.", tone: "neutral" },
      { time: "07:02", event: "Analysis failed", detail: "Latency guardrail exceeded during canary.", tone: "danger" },
      { time: "07:04", event: "Rollback ready", detail: "Previous stable version v2.7.1 selected as suggested rollback target.", tone: "warning" }
    ],
    logs: {
      githubActions: { title: "GitHub Actions build logs", lines: ["unit tests passed", "image build completed", "workflow concluded: success"] },
      imageScan: { title: "Docker image scan/sign logs", lines: ["medium vulnerabilities: 2", "signed image check: pass", "namespace check: pass"] },
      argoCd: { title: "ArgoCD sync events", lines: ["sync revision fd80a11", "resources applied", "application health: degraded"] },
      kubernetes: { title: "Kubernetes pod logs", lines: ["checkout-6db readiness probe failed", "upstream timeout observed", "pod restart count increased"] },
      kyverno: { title: "Kyverno policy validation logs", lines: ["resource limits required: pass", "signed images required: pass", "required labels: pass"] },
      argoRollouts: { title: "Argo Rollouts canary events", lines: ["setWeight 10", "analysis run latency-check failed", "rollout paused for operator action"] }
    },
    previousStableVersions: [
      { version: "v2.7.1", commit: "b721cd0", image: "docker.io/kuberpull/checkout:2.7.1", deployedAt: "2026-06-07 10:19" },
      { version: "v2.6.9", commit: "80ac1fe", image: "docker.io/kuberpull/checkout:2.6.9", deployedAt: "2026-06-02 09:04" }
    ]
  },
  {
    id: "dep-catalog-stage-320",
    serviceId: "catalog-api",
    service: "Catalog API",
    version: "v3.2.0",
    environment: "stage",
    status: "Sync warning",
    tone: "drift" as StatusTone,
    commit: "ab12f90",
    image: "docker.io/kuberpull/catalog-api:3.2.0",
    deployedBy: "Sam Rivera",
    deployedAt: "2026-06-10 16:42",
    deploymentType: "promotion from dev",
    rolloutStrategy: "standard",
    githubActionsStatus: "succeeded",
    argoCdSyncStatus: "out of sync",
    rolloutStatus: "sync warning",
    healthChecks: [
      { name: "Readiness probes", status: "passing", tone: "success" },
      { name: "Replica drift", status: "detected", tone: "drift" },
      { name: "Search latency", status: "normal", tone: "success" }
    ],
    timeline: [
      { time: "16:20", event: "Build completed", detail: "Catalog API image produced for stage.", tone: "success" },
      { time: "16:31", event: "ArgoCD sync warning", detail: "Desired replicas differ from observed state.", tone: "drift" },
      { time: "16:42", event: "Deployment recorded", detail: "Stage deployment snapshot stored as mock data.", tone: "neutral" }
    ],
    logs: {
      githubActions: { title: "GitHub Actions build logs", lines: ["python tests passed", "docker build completed", "workflow concluded: success"] },
      imageScan: { title: "Docker image scan/sign logs", lines: ["critical vulnerabilities: 0", "image signature placeholder recorded"] },
      argoCd: { title: "ArgoCD sync events", lines: ["app diff generated", "replicas differ from desired state", "sync status: out of sync"] },
      kubernetes: { title: "Kubernetes pod logs", lines: ["catalog-api stage pod ready", "index refresh warning below threshold"] },
      kyverno: { title: "Kyverno policy validation logs", lines: ["resource limits required: fail", "required labels: pass"] },
      argoRollouts: { title: "Argo Rollouts canary events", lines: ["standard rollout selected", "no canary analysis required"] }
    },
    previousStableVersions: [
      { version: "v3.1.8", commit: "aa90cd1", image: "docker.io/kuberpull/catalog-api:3.1.8", deployedAt: "2026-06-08 11:22" }
    ]
  },
  {
    id: "dep-orders-worker-stage-096",
    serviceId: "orders-worker",
    service: "Orders Worker",
    version: "v0.9.6",
    environment: "stage",
    status: "Failed",
    tone: "danger" as StatusTone,
    commit: "0bc44ea",
    image: "docker.io/kuberpull/orders-worker:0.9.6",
    deployedBy: "Nora Ali",
    deployedAt: "2026-06-10 14:03",
    deploymentType: "direct deploy",
    rolloutStrategy: "canary",
    githubActionsStatus: "succeeded",
    argoCdSyncStatus: "failed",
    rolloutStatus: "failed",
    healthChecks: [
      { name: "Worker startup", status: "failed", tone: "danger" },
      { name: "Queue consumer", status: "not ready", tone: "danger" },
      { name: "Policy validation", status: "failed", tone: "danger" }
    ],
    timeline: [
      { time: "13:40", event: "Build completed", detail: "Orders Worker image built successfully.", tone: "success" },
      { time: "13:51", event: "Policy rejected", detail: "Kyverno required labels policy failed.", tone: "danger" },
      { time: "14:03", event: "Deployment failed", detail: "ArgoCD sync marked failed in mock deployment history.", tone: "danger" }
    ],
    logs: {
      githubActions: { title: "GitHub Actions build logs", lines: ["go test passed", "worker image built", "workflow concluded: success"] },
      imageScan: { title: "Docker image scan/sign logs", lines: ["scan completed", "signature placeholder recorded", "namespace approved"] },
      argoCd: { title: "ArgoCD sync events", lines: ["sync revision 0bc44ea", "apply failed", "policy rejection returned by admission controller"] },
      kubernetes: { title: "Kubernetes pod logs", lines: ["pod admission denied", "worker deployment unavailable", "no ready replicas"] },
      kyverno: { title: "Kyverno policy validation logs", lines: ["required labels: fail", "team label missing", "cost-center label missing"] },
      argoRollouts: { title: "Argo Rollouts canary events", lines: ["canary rollout created", "analysis skipped after policy rejection", "rollout failed"] }
    },
    previousStableVersions: [
      { version: "v0.9.4", commit: "1f800de", image: "docker.io/kuberpull/orders-worker:0.9.4", deployedAt: "2026-06-04 13:08" }
    ]
  },
  {
    id: "dep-idp-portal-dev-010",
    serviceId: "idp-portal",
    service: "IDP Portal",
    version: "v0.1.0",
    environment: "dev",
    status: "Building",
    tone: "info" as StatusTone,
    commit: "1dbe991",
    image: "docker.io/kuberpull/idp-portal:0.1.0",
    deployedBy: "Avery Morgan",
    deployedAt: "2026-06-11 10:22",
    deploymentType: "direct deploy",
    rolloutStrategy: "standard",
    githubActionsStatus: "running",
    argoCdSyncStatus: "prepared",
    rolloutStatus: "building",
    healthChecks: [
      { name: "Build status", status: "running", tone: "info" },
      { name: "Preview environment", status: "pending", tone: "warning" },
      { name: "Static checks", status: "pending", tone: "warning" }
    ],
    timeline: [
      { time: "10:22", event: "Deployment requested", detail: "Mock dev deployment started from portal action.", tone: "info" },
      { time: "10:24", event: "Build running", detail: "GitHub Actions status is mocked as running.", tone: "info" }
    ],
    logs: {
      githubActions: { title: "GitHub Actions build logs", lines: ["install dependencies", "typecheck pending", "build pending"] },
      imageScan: { title: "Docker image scan/sign logs", lines: ["image path reserved", "scan waiting for image"] },
      argoCd: { title: "ArgoCD sync events", lines: ["application prepared", "sync waiting for image"] },
      kubernetes: { title: "Kubernetes pod logs", lines: ["no pods created yet", "dev namespace ready"] },
      kyverno: { title: "Kyverno policy validation logs", lines: ["validation pending"] },
      argoRollouts: { title: "Argo Rollouts canary events", lines: ["standard rollout selected", "rollout pending"] }
    },
    previousStableVersions: [
      { version: "v0.0.9", commit: "bd0a918", image: "docker.io/kuberpull/idp-portal:0.0.9", deployedAt: "2026-06-10 08:30" }
    ]
  }
];

export const deploymentOperationsStats = [
  { label: "Total deployments", value: String(deployments.length), detail: "Mock deployment records", tone: "neutral" as StatusTone },
  { label: "Successful deployments", value: String(deployments.filter((deployment) => deployment.tone === "success").length), detail: "Healthy or completed", tone: "success" as StatusTone },
  { label: "Failed deployments", value: String(deployments.filter((deployment) => deployment.status.toLowerCase().includes("failed")).length), detail: "Requires owner review", tone: "danger" as StatusTone },
  { label: "Active rollouts", value: "2", detail: "Canary/building mock states", tone: "warning" as StatusTone },
  { label: "Rollbacks this month", value: "2", detail: "Mock rollback requests", tone: "neutral" as StatusTone }
];

export const deployNewVersionDefaults = {
  environments: ["dev", "stage", "prod"] as EnvironmentName[],
  rolloutStrategies: ["standard", "canary"] as RolloutStrategy[]
};

export const environmentPromotions: EnvironmentPromotion[] = [
  {
    serviceId: "payments-api",
    environments: [
      { environment: "dev", version: "v1.18.5", status: "Ready", tone: "success", promotionEligibility: "Eligible for stage", requiredApproval: "Team Lead", approvedBy: "Maya Chen", promotedAt: "2026-06-11 08:20" },
      { environment: "stage", version: "v1.18.4", status: "Verified", tone: "success", promotionEligibility: "Eligible for prod", requiredApproval: "Team Lead", approvedBy: "Maya Chen", promotedAt: "2026-06-11 08:54" },
      { environment: "prod", version: "v1.18.4", status: "Live", tone: "success", promotionEligibility: "Current production", requiredApproval: "Completed", approvedBy: "Maya Chen", promotedAt: "2026-06-11 09:18" }
    ],
    history: [
      { from: "stage", to: "prod", version: "v1.18.4", status: "completed", approvedBy: "Maya Chen", promotedAt: "2026-06-11 09:18" },
      { from: "dev", to: "stage", version: "v1.18.4", status: "completed", approvedBy: "Maya Chen", promotedAt: "2026-06-11 08:54" }
    ]
  },
  {
    serviceId: "checkout-service",
    environments: [
      { environment: "dev", version: "v2.7.4", status: "Ready", tone: "success", promotionEligibility: "Eligible for stage", requiredApproval: "Team Lead", approvedBy: "Andre Patel", promotedAt: "2026-06-11 06:12" },
      { environment: "stage", version: "v2.7.3", status: "Canary paused", tone: "warning", promotionEligibility: "Blocked", requiredApproval: "Production approval", approvedBy: "Pending", promotedAt: "Pending" },
      { environment: "prod", version: "v2.7.1", status: "Stable", tone: "success", promotionEligibility: "Rollback target", requiredApproval: "Completed", approvedBy: "Andre Patel", promotedAt: "2026-06-07 10:19" }
    ],
    history: [
      { from: "dev", to: "stage", version: "v2.7.3", status: "needs approval", approvedBy: "Pending", promotedAt: "Pending" },
      { from: "stage", to: "prod", version: "v2.7.1", status: "completed", approvedBy: "Andre Patel", promotedAt: "2026-06-07 10:19" }
    ]
  },
  {
    serviceId: "catalog-api",
    environments: [
      { environment: "dev", version: "v3.2.1", status: "Ready", tone: "success", promotionEligibility: "Eligible for stage", requiredApproval: "Developer", approvedBy: "Sam Rivera", promotedAt: "2026-06-10 15:40" },
      { environment: "stage", version: "v3.2.0", status: "Drift warning", tone: "drift", promotionEligibility: "Blocked by drift", requiredApproval: "Team Lead", approvedBy: "Pending", promotedAt: "Pending" },
      { environment: "prod", version: "v3.1.8", status: "Stable", tone: "success", promotionEligibility: "Current production", requiredApproval: "Completed", approvedBy: "Sam Rivera", promotedAt: "2026-06-08 11:22" }
    ],
    history: [
      { from: "dev", to: "stage", version: "v3.2.0", status: "completed", approvedBy: "Sam Rivera", promotedAt: "2026-06-10 16:42" }
    ]
  },
  {
    serviceId: "idp-portal",
    environments: [
      { environment: "dev", version: "v0.1.0", status: "Building", tone: "info", promotionEligibility: "Waiting for build", requiredApproval: "Team Lead", approvedBy: "Pending", promotedAt: "Pending" },
      { environment: "stage", version: "v0.0.9", status: "Ready", tone: "success", promotionEligibility: "Eligible for prod", requiredApproval: "Team Lead", approvedBy: "Avery Morgan", promotedAt: "2026-06-10 09:00" },
      { environment: "prod", version: "v0.0.8", status: "Stable", tone: "success", promotionEligibility: "Current production", requiredApproval: "Completed", approvedBy: "Avery Morgan", promotedAt: "2026-06-09 09:00" }
    ],
    history: [
      { from: "dev", to: "stage", version: "v0.0.9", status: "completed", approvedBy: "Avery Morgan", promotedAt: "2026-06-10 09:00" }
    ]
  },
  {
    serviceId: "orders-worker",
    environments: [
      { environment: "dev", version: "v0.9.7", status: "Ready", tone: "success", promotionEligibility: "Eligible for stage", requiredApproval: "Team Lead", approvedBy: "Nora Ali", promotedAt: "2026-06-10 12:15" },
      { environment: "stage", version: "v0.9.6", status: "Failed", tone: "danger", promotionEligibility: "Blocked", requiredApproval: "Policy remediation", approvedBy: "Pending", promotedAt: "Pending" },
      { environment: "prod", version: "v0.9.4", status: "Stable", tone: "success", promotionEligibility: "Current production", requiredApproval: "Completed", approvedBy: "Nora Ali", promotedAt: "2026-06-04 13:08" }
    ],
    history: [
      { from: "dev", to: "stage", version: "v0.9.6", status: "blocked", approvedBy: "Policy engine", promotedAt: "2026-06-10 14:03" }
    ]
  }
];

export const resourceOfferings = [
  { name: "PostgreSQL", icon: Database, description: "Managed relational database claim with backup metadata.", capability: "Crossplane claim placeholder" },
  { name: "Redis", icon: Zap, description: "Low-latency cache for service-owned workloads.", capability: "Crossplane claim placeholder" },
  { name: "S3 Bucket", icon: Cloud, description: "Object storage bucket with cost allocation labels.", capability: "Crossplane claim placeholder" },
  { name: "SQS Queue", icon: Workflow, description: "Message queue with retry and DLQ conventions.", capability: "Crossplane claim placeholder" },
  { name: "Kubernetes Namespace", icon: SquareStack, description: "Namespace boundary with labels, quotas, and policy visibility.", capability: "Kubernetes placeholder" }
];

export const provisionedResources = [
  { name: "payments-postgres", type: "PostgreSQL", service: "Payments API", serviceId: "payments-api", owner: "Payments", teamId: "payments", environment: "prod", status: "Ready" },
  { name: "payments-vault-path", type: "Secret path", service: "Payments API", serviceId: "payments-api", owner: "Payments", teamId: "payments", environment: "prod", status: "Ready" },
  { name: "orders-postgres", type: "PostgreSQL", service: "Checkout Service", serviceId: "checkout-service", owner: "Commerce", teamId: "commerce", environment: "prod", status: "Ready" },
  { name: "redis-checkout", type: "Redis", service: "Checkout Service", serviceId: "checkout-service", owner: "Commerce", teamId: "commerce", environment: "prod", status: "Degraded" },
  { name: "sqs-checkout-events", type: "SQS Queue", service: "Checkout Service", serviceId: "checkout-service", owner: "Commerce", teamId: "commerce", environment: "prod", status: "Ready" },
  { name: "catalog-cache", type: "Redis", service: "Catalog API", serviceId: "catalog-api", owner: "Commerce", teamId: "commerce", environment: "stage", status: "Provisioning" },
  { name: "s3-product-assets", type: "S3 Bucket", service: "Catalog API", serviceId: "catalog-api", owner: "Commerce", teamId: "commerce", environment: "prod", status: "Ready" },
  { name: "sqs-order-events", type: "SQS Queue", service: "Orders Worker", serviceId: "orders-worker", owner: "Commerce", teamId: "commerce", environment: "stage", status: "Ready" },
  { name: "idp-dev-namespace", type: "Kubernetes Namespace", service: "IDP Portal", serviceId: "idp-portal", owner: "Developer Experience", teamId: "developer-experience", environment: "dev", status: "Ready" }
];

export const costs = [
  { scope: "Commerce", monthToDate: "$22,730", trend: "+4.2%", driver: "Checkout, catalog, and order worker workloads" },
  { scope: "Payments", monthToDate: "$12,860", trend: "-1.1%", driver: "Stable production usage" },
  { scope: "Developer Experience", monthToDate: "$3,220", trend: "+2.4%", driver: "IDP portal development environments" }
];

export const platformHealthSignals = [
  { name: "GitHub", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked at 10:28", icon: GitBranch },
  { name: "GitHub Actions", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked at 10:27", icon: Activity },
  { name: "Docker Hub", status: "Warning", tone: "warning" as StatusTone, freshness: "Mocked pull-rate warning", icon: PackageCheck },
  { name: "ArgoCD", status: "Warning", tone: "warning" as StatusTone, freshness: "Mocked sync warning", icon: ShipWheel },
  { name: "Kubernetes", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked at 10:26", icon: Gauge },
  { name: "Crossplane", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked claim sync", icon: Boxes },
  { name: "Vault", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked secret lease view", icon: LockKeyhole },
  { name: "Kyverno", status: "Violation", tone: "danger" as StatusTone, freshness: "Mocked policy results", icon: ShieldCheck },
  { name: "Prometheus", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked scrape health", icon: HeartPulse },
  { name: "Loki", status: "Healthy", tone: "success" as StatusTone, freshness: "Mocked log query health", icon: FileText }
];

export const platformHealthOperational = [
  { name: "GitHub", status: "Healthy", tone: "success" as StatusTone, uptime: "99.99%", lastCheck: "45s ago" },
  { name: "Docker Hub", status: "Warning", tone: "warning" as StatusTone, uptime: "99.91%", lastCheck: "1m ago" },
  { name: "ArgoCD", status: "Sync warning", tone: "drift" as StatusTone, uptime: "99.95%", lastCheck: "30s ago" },
  { name: "Kubernetes", status: "Healthy", tone: "success" as StatusTone, uptime: "99.98%", lastCheck: "20s ago" },
  { name: "Vault", status: "Healthy", tone: "success" as StatusTone, uptime: "99.97%", lastCheck: "50s ago" },
  { name: "Crossplane", status: "Healthy", tone: "success" as StatusTone, uptime: "99.94%", lastCheck: "1m ago" },
  { name: "Kyverno", status: "Violation", tone: "danger" as StatusTone, uptime: "99.96%", lastCheck: "40s ago" },
  { name: "Prometheus", status: "Healthy", tone: "success" as StatusTone, uptime: "99.99%", lastCheck: "15s ago" }
];

export const governancePolicyChecks = [
  {
    policy: "resource limits required",
    service: "Payments API",
    environment: "prod",
    status: "Pass",
    tone: "success" as StatusTone
  },
  {
    policy: "signed images required",
    service: "Checkout Service",
    environment: "prod",
    status: "Fail",
    tone: "danger" as StatusTone
  },
  {
    policy: "platform-managed Docker Hub namespace",
    service: "Catalog API",
    environment: "stage",
    status: "Pass",
    tone: "success" as StatusTone
  },
  {
    policy: "required labels",
    service: "Orders Worker",
    environment: "stage",
    status: "Fail",
    tone: "danger" as StatusTone
  },
  {
    policy: "no privileged containers",
    service: "IDP Portal",
    environment: "dev",
    status: "Pass",
    tone: "success" as StatusTone
  },
  {
    policy: "resource limits required",
    service: "Catalog API",
    environment: "stage",
    status: "Fail",
    tone: "danger" as StatusTone
  }
];

export const scorecardStandards = [
  "ownership defined",
  "runbook exists",
  "API docs exists",
  "event docs exists",
  "resource limits configured",
  "signed image enabled",
  "platform-managed Docker Hub namespace",
  "monitoring enabled",
  "logs enabled",
  "rollback configured",
  "disaster recovery configured",
  "production approval required"
];

export const serviceScorecards = [
  {
    serviceId: "payments-api",
    overallScore: 92,
    passedChecks: 11,
    failedChecks: 1,
    maturityLevel: "production-ready",
    recommendations: ["Add quarterly restore test evidence to DR metadata."],
    checks: scorecardStandards.map((name) => ({
      name,
      passed: name !== "disaster recovery configured",
      recommendation: name === "disaster recovery configured" ? "Attach latest restore validation and backup policy." : "No action required."
    }))
  },
  {
    serviceId: "checkout-service",
    overallScore: 75,
    passedChecks: 9,
    failedChecks: 3,
    maturityLevel: "standard",
    recommendations: ["Fix signed image exception.", "Complete DR runbook review.", "Require production approval before canary expansion."],
    checks: scorecardStandards.map((name) => ({
      name,
      passed: !["signed image enabled", "disaster recovery configured", "production approval required"].includes(name),
      recommendation: ["signed image enabled", "disaster recovery configured", "production approval required"].includes(name)
        ? "Remediate before marking production-ready."
        : "No action required."
    }))
  },
  {
    serviceId: "catalog-api",
    overallScore: 83,
    passedChecks: 10,
    failedChecks: 2,
    maturityLevel: "standard",
    recommendations: ["Restore resource limits in stage.", "Link current event documentation."],
    checks: scorecardStandards.map((name) => ({
      name,
      passed: !["resource limits configured", "event docs exists"].includes(name),
      recommendation: ["resource limits configured", "event docs exists"].includes(name)
        ? "Update service metadata and GitOps manifests."
        : "No action required."
    }))
  },
  {
    serviceId: "idp-portal",
    overallScore: 67,
    passedChecks: 8,
    failedChecks: 4,
    maturityLevel: "basic",
    recommendations: ["Add rollback runbook.", "Define DR profile.", "Connect production approval requirement.", "Publish API docs metadata."],
    checks: scorecardStandards.map((name) => ({
      name,
      passed: !["API docs exists", "rollback configured", "disaster recovery configured", "production approval required"].includes(name),
      recommendation: ["API docs exists", "rollback configured", "disaster recovery configured", "production approval required"].includes(name)
        ? "Complete before production readiness review."
        : "No action required."
    }))
  },
  {
    serviceId: "orders-worker",
    overallScore: 58,
    passedChecks: 7,
    failedChecks: 5,
    maturityLevel: "basic",
    recommendations: ["Add required labels and limits.", "Enable signed image enforcement.", "Complete monitoring and DR setup."],
    checks: scorecardStandards.map((name) => ({
      name,
      passed: !["resource limits configured", "signed image enabled", "monitoring enabled", "disaster recovery configured", "production approval required"].includes(name),
      recommendation: ["resource limits configured", "signed image enabled", "monitoring enabled", "disaster recovery configured", "production approval required"].includes(name)
        ? "Required for standard maturity."
        : "No action required."
    }))
  }
];

export const driftFindings = [
  { serviceId: "catalog-api", service: "Catalog API", environment: "stage", resource: "deployment/catalog-api", desiredState: "replicas: 3", liveState: "replicas: 5", driftType: "replicas changed manually", severity: "high", tone: "danger" as StatusTone, detectedAt: "2026-06-11 08:42", recommendedAction: "Reconcile replicas from GitOps desired state." },
  { serviceId: "checkout-service", service: "Checkout Service", environment: "prod", resource: "deployment/checkout-service", desiredState: "image: checkout:2.7.1", liveState: "image: checkout:2.7.3", driftType: "image tag differs from Git", severity: "critical", tone: "danger" as StatusTone, detectedAt: "2026-06-11 07:20", recommendedAction: "Review canary state and rollback or update Git." },
  { serviceId: "orders-worker", service: "Orders Worker", environment: "stage", resource: "deployment/orders-worker", desiredState: "limits: cpu/memory present", liveState: "limits: removed", driftType: "resource limits removed", severity: "high", tone: "danger" as StatusTone, detectedAt: "2026-06-10 14:03", recommendedAction: "Restore limits and required labels." },
  { serviceId: "payments-api", service: "Payments API", environment: "prod", resource: "service/payments-api", desiredState: "annotation owner=payments", liveState: "annotation owner=platform", driftType: "service annotation changed", severity: "medium", tone: "drift" as StatusTone, detectedAt: "2026-06-10 16:31", recommendedAction: "Reapply service metadata from Git." },
  { serviceId: "idp-portal", service: "IDP Portal", environment: "dev", resource: "configmap/idp-portal-env", desiredState: "FEATURE_SCORECARDS=true", liveState: "FEATURE_SCORECARDS=false", driftType: "config map differs", severity: "low", tone: "drift" as StatusTone, detectedAt: "2026-06-09 11:04", recommendedAction: "Review local dev override before reconcile." }
];

export const disasterRecoveryRecords = [
  { serviceId: "payments-api", service: "Payments API", criticality: "tier 0", backupStatus: "Healthy", backupTone: "success" as StatusTone, lastBackupTime: "2026-06-11 02:00", lastRestoreTest: "2026-06-01", rpo: "15m", rto: "1h", readinessStatus: "Ready", readinessTone: "success" as StatusTone, runbook: "https://docs.example.com/runbooks/payments-dr", resource: "payments-postgres" },
  { serviceId: "checkout-service", service: "Checkout Service", criticality: "tier 0", backupStatus: "Healthy", backupTone: "success" as StatusTone, lastBackupTime: "2026-06-11 02:20", lastRestoreTest: "2026-05-12", rpo: "30m", rto: "2h", readinessStatus: "Needs restore test", readinessTone: "warning" as StatusTone, runbook: "https://docs.example.com/runbooks/checkout-dr", resource: "orders-postgres" },
  { serviceId: "catalog-api", service: "Catalog API", criticality: "tier 1", backupStatus: "Partial", backupTone: "warning" as StatusTone, lastBackupTime: "2026-06-10 23:00", lastRestoreTest: "2026-04-18", rpo: "1h", rto: "4h", readinessStatus: "At risk", readinessTone: "warning" as StatusTone, runbook: "https://docs.example.com/runbooks/catalog-dr", resource: "s3-product-assets" },
  { serviceId: "orders-worker", service: "Orders Worker", criticality: "tier 1", backupStatus: "Missing", backupTone: "danger" as StatusTone, lastBackupTime: "Never", lastRestoreTest: "Never", rpo: "unknown", rto: "unknown", readinessStatus: "Gap detected", readinessTone: "danger" as StatusTone, runbook: "https://docs.example.com/runbooks/orders-dr", resource: "sqs-order-events" },
  { serviceId: "idp-portal", service: "IDP Portal", criticality: "tier 2", backupStatus: "Not required", backupTone: "neutral" as StatusTone, lastBackupTime: "N/A", lastRestoreTest: "N/A", rpo: "24h", rto: "8h", readinessStatus: "Basic", readinessTone: "neutral" as StatusTone, runbook: "https://docs.example.com/runbooks/idp-dr", resource: "idp-dev-namespace" }
];

export const auditLogs = [
  { actor: "Nora Ali", action: "service created", target: "Orders Worker", result: "succeeded", time: "31 min ago" },
  { actor: "Maya Chen", action: "deployment triggered", target: "Payments API prod v1.18.4", result: "succeeded", time: "12 min ago" },
  { actor: "Andre Patel", action: "rollback requested", target: "Checkout Service prod to v2.7.1", result: "pending", time: "2 hrs ago" },
  { actor: "Sam Rivera", action: "resource provisioned", target: "catalog-cache", result: "pending", time: "3 hrs ago" },
  { actor: "Policy engine", action: "policy violation detected", target: "Orders Worker required labels", result: "failed", time: "2 hrs ago" },
  { actor: "Drift scanner", action: "drift detected", target: "Catalog API stage replicas", result: "open", time: "1 hr ago" },
  { actor: "Avery Morgan", action: "role changed", target: "Nora Ali to Developer", result: "succeeded", time: "3 hrs ago" },
  { actor: "Andre Patel", action: "production approval requested", target: "Checkout Service v2.7.3", result: "pending", time: "2 hrs ago" },
  { actor: "Maya Chen", action: "production approval granted", target: "Payments API v1.18.4", result: "succeeded", time: "1 hr ago" },
  { actor: "Promotion workflow", action: "promotion completed", target: "Payments API stage to prod", result: "succeeded", time: "55 min ago" },
  { actor: "RBAC guard", action: "unauthorized action blocked", target: "Viewer deploy to prod", result: "blocked", time: "42 min ago" },
  { actor: "Scorecard worker", action: "scorecard failed", target: "Orders Worker production readiness", result: "failed", time: "35 min ago" },
  { actor: "Drift scanner", action: "drift detected", target: "Checkout Service image tag", result: "open", time: "30 min ago" },
  { actor: "Sam Rivera", action: "drift reconciled", target: "Catalog API replicas", result: "succeeded", time: "22 min ago" },
  { actor: "Backup controller", action: "backup completed", target: "payments-postgres", result: "succeeded", time: "2 hrs ago" },
  { actor: "DR workflow", action: "restore test completed", target: "Payments API restore rehearsal", result: "succeeded", time: "1 day ago" },
  { actor: "DR scanner", action: "DR gap detected", target: "Orders Worker backup policy", result: "open", time: "4 hrs ago" }
];

export const settings = [
  { name: "Tenant", value: "Senior Platform Demo" },
  { name: "Environments", value: "dev, stage, prod" },
  { name: "Authentication", value: "Mock session" },
  { name: "Integrations", value: "Configured as placeholders only" }
];

export function getServiceById(serviceId: string) {
  return services.find((service) => service.id === serviceId);
}

export function getPromotionByServiceId(serviceId: string) {
  return environmentPromotions.find((promotion) => promotion.serviceId === serviceId);
}

export function getScorecardByServiceId(serviceId: string) {
  return serviceScorecards.find((scorecard) => scorecard.serviceId === serviceId);
}

export function getTeamById(teamId: string) {
  return teams.find((team) => team.id === teamId);
}

export function getServiceResources(serviceId: string) {
  return provisionedResources.filter((resource) => resource.serviceId === serviceId);
}

export function getTeamServices(teamId: string) {
  return services.filter((service) => service.teamId === teamId);
}

export function getTeamResources(teamId: string) {
  return provisionedResources.filter((resource) => resource.teamId === teamId);
}

export function getServiceDependents(serviceId: string) {
  const service = getServiceById(serviceId);

  if (!service) {
    return [];
  }

  return services.filter((candidate) =>
    candidate.dependencies.some((dependency) => dependency.name === service.name)
  );
}
