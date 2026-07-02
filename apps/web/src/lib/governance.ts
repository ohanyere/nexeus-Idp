import type { EnvironmentName, StatusTone } from "@/lib/mock-data";

export type PolicySeverity = "critical" | "high" | "medium" | "low";
export type PolicyEnforcementMode = "audit" | "warn" | "enforce";
export type PolicyCatalogStatus = "enabled" | "disabled";
export type PolicyViolationStatus = "open" | "in progress" | "resolved" | "accepted risk";
export type CompliancePosture = "compliant" | "warning" | "critical" | "unknown";

export type PolicyCategory =
  | "Resource limits missing"
  | "Runs as root"
  | "Privileged container"
  | "Missing NetworkPolicy"
  | "Missing probes"
  | "Unsigned image"
  | "Vulnerable image"
  | "Missing owner label"
  | "Missing cost-center label"
  | "Public ingress risk"
  | "No PodDisruptionBudget"
  | "HPA missing"
  | "Secrets mounted incorrectly";

export type PolicyCatalogItem = {
  id: string;
  title: string;
  category: PolicyCategory;
  description: string;
  severity: PolicySeverity;
  status: PolicyCatalogStatus;
  enforcementMode: PolicyEnforcementMode;
  framework: "Kyverno" | "OPA Gatekeeper" | "Scorecard";
  owner: string;
  remediation: string;
};

export type PolicyViolation = {
  id: string;
  policyId: string;
  serviceId: string;
  service: string;
  team: string;
  environment: EnvironmentName;
  category: PolicyCategory;
  severity: PolicySeverity;
  status: PolicyViolationStatus;
  resource: string;
  detectedAt: string;
  lastSeenAt: string;
  remediation: string;
  auditEvent: string;
};

export type ServicePolicyScorecard = {
  serviceId: string;
  service: string;
  team: string;
  score: number;
  posture: CompliancePosture;
  evaluatedPolicies: number;
  passingPolicies: number;
  failingPolicies: number;
  lastEvaluatedAt: string;
};

export type TeamComplianceSummary = {
  team: string;
  score: number;
  openViolations: number;
  criticalViolations: number;
  servicesAtRisk: number;
};

export type PolicyEvent = {
  id: string;
  time: string;
  service: string;
  team: string;
  environment: EnvironmentName;
  event: string;
  result: string;
  tone: StatusTone;
};

export type RuntimePolicyViolation = {
  id: string;
  policy: string;
  serviceId: string;
  service: string;
  team: string;
  environment: EnvironmentName;
  severity: PolicySeverity;
  status: "open" | "warning" | "error";
  resource: string;
  namespace: string;
  lastSeenAt: string;
  remediation: string;
  auditEvent: string;
  source: "Kyverno";
};

export type GovernanceRuntimeSnapshot = {
  source: "Kyverno";
  attempted: boolean;
  warning?: string;
  policyReportCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  errorCount: number;
  violations: RuntimePolicyViolation[];
};

export const policyCatalog: PolicyCatalogItem[] = [
  {
    id: "require-resource-limits",
    title: "Require CPU and memory limits",
    category: "Resource limits missing",
    description: "Containers must declare requests and limits before promotion to shared clusters.",
    severity: "high",
    status: "enabled",
    enforcementMode: "warn",
    framework: "Kyverno",
    owner: "Platform Engineering",
    remediation: "Add resources.requests and resources.limits to each container in the base workload manifest."
  },
  {
    id: "disallow-root-user",
    title: "Disallow root user",
    category: "Runs as root",
    description: "Pods must set runAsNonRoot and avoid UID 0 at the pod or container security context.",
    severity: "critical",
    status: "enabled",
    enforcementMode: "enforce",
    framework: "Kyverno",
    owner: "Runtime Security",
    remediation: "Set securityContext.runAsNonRoot=true and run the image with a non-root UID."
  },
  {
    id: "disallow-privileged",
    title: "Disallow privileged containers",
    category: "Privileged container",
    description: "Privileged mode is blocked for application workloads.",
    severity: "critical",
    status: "enabled",
    enforcementMode: "enforce",
    framework: "Kyverno",
    owner: "Runtime Security",
    remediation: "Remove privileged=true and request a platform exception only for approved infrastructure agents."
  },
  {
    id: "require-network-policy",
    title: "Require NetworkPolicy",
    category: "Missing NetworkPolicy",
    description: "Services need default-deny and explicit ingress or egress policy before production rollout.",
    severity: "medium",
    status: "enabled",
    enforcementMode: "audit",
    framework: "OPA Gatekeeper",
    owner: "Platform Networking",
    remediation: "Add a NetworkPolicy that allows only required service, ingress, and dependency traffic."
  },
  {
    id: "require-probes",
    title: "Require readiness and liveness probes",
    category: "Missing probes",
    description: "Deployments must expose health probes for rollout safety and traffic routing.",
    severity: "high",
    status: "enabled",
    enforcementMode: "warn",
    framework: "Kyverno",
    owner: "Platform Engineering",
    remediation: "Define readinessProbe and livenessProbe for every serving container."
  },
  {
    id: "require-signed-images",
    title: "Require signed images",
    category: "Unsigned image",
    description: "Images must carry a trusted signature from the CI signing workflow.",
    severity: "critical",
    status: "enabled",
    enforcementMode: "warn",
    framework: "Kyverno",
    owner: "Supply Chain Security",
    remediation: "Rebuild through the approved GitHub Actions workflow so the image is signed and attested."
  },
  {
    id: "block-vulnerable-images",
    title: "Block vulnerable images",
    category: "Vulnerable image",
    description: "Runtime images with critical CVEs require remediation before production deployment.",
    severity: "critical",
    status: "enabled",
    enforcementMode: "audit",
    framework: "Scorecard",
    owner: "Supply Chain Security",
    remediation: "Patch the base image or dependency layer, rebuild, scan, and promote the fixed tag."
  },
  {
    id: "require-owner-label",
    title: "Require owner label",
    category: "Missing owner label",
    description: "Every workload needs platform.io/owner for ownership, alert routing, and cost attribution.",
    severity: "medium",
    status: "enabled",
    enforcementMode: "warn",
    framework: "OPA Gatekeeper",
    owner: "Developer Experience",
    remediation: "Add platform.io/owner to shared labels in the base kustomization or workload metadata."
  },
  {
    id: "require-cost-center-label",
    title: "Require cost-center label",
    category: "Missing cost-center label",
    description: "Workloads must include platform.io/cost-center for monthly allocation reports.",
    severity: "low",
    status: "enabled",
    enforcementMode: "audit",
    framework: "OPA Gatekeeper",
    owner: "FinOps",
    remediation: "Add platform.io/cost-center with the owning team's approved cost center code."
  },
  {
    id: "review-public-ingress",
    title: "Review public ingress exposure",
    category: "Public ingress risk",
    description: "Internet-facing ingress requires explicit team ownership and security review.",
    severity: "high",
    status: "enabled",
    enforcementMode: "warn",
    framework: "Kyverno",
    owner: "Platform Networking",
    remediation: "Restrict ingress scope, add an approved host, and link the security review in service docs."
  },
  {
    id: "require-pdb",
    title: "Require PodDisruptionBudget",
    category: "No PodDisruptionBudget",
    description: "Production services must define disruption budgets to survive node maintenance.",
    severity: "medium",
    status: "enabled",
    enforcementMode: "audit",
    framework: "Kyverno",
    owner: "Platform Reliability",
    remediation: "Add a PodDisruptionBudget with minAvailable or maxUnavailable aligned to replica count."
  },
  {
    id: "require-hpa",
    title: "Require HPA for production",
    category: "HPA missing",
    description: "Production workloads need autoscaling policy or an approved capacity exception.",
    severity: "medium",
    status: "disabled",
    enforcementMode: "audit",
    framework: "Scorecard",
    owner: "Platform Reliability",
    remediation: "Add an HPA tied to CPU, memory, or service-level custom metrics."
  },
  {
    id: "validate-secret-mounts",
    title: "Validate secret mounts",
    category: "Secrets mounted incorrectly",
    description: "Secrets must be mounted read-only and scoped to the container that requires them.",
    severity: "high",
    status: "enabled",
    enforcementMode: "warn",
    framework: "Kyverno",
    owner: "Runtime Security",
    remediation: "Set secret volume mounts readOnly=true and remove unused secret references from sibling containers."
  }
];

export const policyViolations: PolicyViolation[] = [
  {
    id: "viol-checkout-signed-image",
    policyId: "require-signed-images",
    serviceId: "checkout-service",
    service: "Checkout Service",
    team: "Commerce",
    environment: "prod",
    category: "Unsigned image",
    severity: "critical",
    status: "open",
    resource: "Deployment/checkout-service",
    detectedAt: "2026-06-30 08:10",
    lastSeenAt: "2026-06-30 10:18",
    remediation: "Rebuild v2.7.3 through the approved CI workflow and promote the signed image tag.",
    auditEvent: "policy.violation.detected"
  },
  {
    id: "viol-checkout-public-ingress",
    policyId: "review-public-ingress",
    serviceId: "checkout-service",
    service: "Checkout Service",
    team: "Commerce",
    environment: "prod",
    category: "Public ingress risk",
    severity: "high",
    status: "in progress",
    resource: "Ingress/checkout-public",
    detectedAt: "2026-06-29 16:42",
    lastSeenAt: "2026-06-30 09:51",
    remediation: "Attach the security review link and restrict public paths to the approved checkout host.",
    auditEvent: "policy.exception.reviewed"
  },
  {
    id: "viol-orders-owner-label",
    policyId: "require-owner-label",
    serviceId: "orders-worker",
    service: "Orders Worker",
    team: "Commerce",
    environment: "stage",
    category: "Missing owner label",
    severity: "medium",
    status: "open",
    resource: "Deployment/orders-worker",
    detectedAt: "2026-06-30 07:35",
    lastSeenAt: "2026-06-30 10:15",
    remediation: "Add platform.io/owner=commerce-orders to the base labels and regenerate the stage overlay.",
    auditEvent: "policy.violation.detected"
  },
  {
    id: "viol-orders-probes",
    policyId: "require-probes",
    serviceId: "orders-worker",
    service: "Orders Worker",
    team: "Commerce",
    environment: "stage",
    category: "Missing probes",
    severity: "high",
    status: "open",
    resource: "Deployment/orders-worker",
    detectedAt: "2026-06-30 07:36",
    lastSeenAt: "2026-06-30 10:15",
    remediation: "Add worker heartbeat readiness and liveness probes before retrying the rollout.",
    auditEvent: "policy.violation.detected"
  },
  {
    id: "viol-catalog-network-policy",
    policyId: "require-network-policy",
    serviceId: "catalog-api",
    service: "Catalog API",
    team: "Commerce",
    environment: "stage",
    category: "Missing NetworkPolicy",
    severity: "medium",
    status: "accepted risk",
    resource: "Namespace/catalog-stage",
    detectedAt: "2026-06-28 13:24",
    lastSeenAt: "2026-06-30 09:02",
    remediation: "Add default-deny plus explicit ingress from preview traffic and egress to catalog-cache.",
    auditEvent: "policy.risk.accepted"
  },
  {
    id: "viol-idp-limits",
    policyId: "require-resource-limits",
    serviceId: "idp-portal",
    service: "IDP Portal",
    team: "Developer Experience",
    environment: "dev",
    category: "Resource limits missing",
    severity: "high",
    status: "in progress",
    resource: "Deployment/idp-portal",
    detectedAt: "2026-06-29 10:04",
    lastSeenAt: "2026-06-30 08:57",
    remediation: "Add conservative dev requests and limits to the Next.js container overlay.",
    auditEvent: "policy.remediation.started"
  },
  {
    id: "viol-payments-pdb",
    policyId: "require-pdb",
    serviceId: "payments-api",
    service: "Payments API",
    team: "Payments",
    environment: "prod",
    category: "No PodDisruptionBudget",
    severity: "medium",
    status: "resolved",
    resource: "Deployment/payments-api",
    detectedAt: "2026-06-27 11:11",
    lastSeenAt: "2026-06-29 14:20",
    remediation: "PDB added with minAvailable=2 and verified by the next policy scan.",
    auditEvent: "policy.violation.resolved"
  }
];

export const servicePolicyScorecards: ServicePolicyScorecard[] = [
  { serviceId: "payments-api", service: "Payments API", team: "Payments", score: 94, posture: "compliant", evaluatedPolicies: 13, passingPolicies: 13, failingPolicies: 0, lastEvaluatedAt: "2026-06-30 10:20" },
  { serviceId: "checkout-service", service: "Checkout Service", team: "Commerce", score: 63, posture: "critical", evaluatedPolicies: 13, passingPolicies: 11, failingPolicies: 2, lastEvaluatedAt: "2026-06-30 10:18" },
  { serviceId: "catalog-api", service: "Catalog API", team: "Commerce", score: 81, posture: "warning", evaluatedPolicies: 12, passingPolicies: 11, failingPolicies: 1, lastEvaluatedAt: "2026-06-30 09:02" },
  { serviceId: "idp-portal", service: "IDP Portal", team: "Developer Experience", score: 78, posture: "warning", evaluatedPolicies: 10, passingPolicies: 9, failingPolicies: 1, lastEvaluatedAt: "2026-06-30 08:57" },
  { serviceId: "orders-worker", service: "Orders Worker", team: "Commerce", score: 58, posture: "critical", evaluatedPolicies: 12, passingPolicies: 10, failingPolicies: 2, lastEvaluatedAt: "2026-06-30 10:15" }
];

export const teamComplianceSummaries: TeamComplianceSummary[] = [
  { team: "Payments", score: 94, openViolations: 0, criticalViolations: 0, servicesAtRisk: 0 },
  { team: "Commerce", score: 67, openViolations: 4, criticalViolations: 1, servicesAtRisk: 3 },
  { team: "Developer Experience", score: 78, openViolations: 1, criticalViolations: 0, servicesAtRisk: 1 },
  { team: "Platform Engineering", score: 100, openViolations: 0, criticalViolations: 0, servicesAtRisk: 0 }
];

export const policyEvents: PolicyEvent[] = [
  { id: "evt-1", time: "10:18", service: "Checkout Service", team: "Commerce", environment: "prod", event: "Kyverno image signature result imported", result: "critical violation", tone: "danger" },
  { id: "evt-2", time: "10:15", service: "Orders Worker", team: "Commerce", environment: "stage", event: "Policy scan completed", result: "2 open violations", tone: "warning" },
  { id: "evt-3", time: "09:51", service: "Checkout Service", team: "Commerce", environment: "prod", event: "Public ingress exception reviewed", result: "in progress", tone: "warning" },
  { id: "evt-4", time: "09:02", service: "Catalog API", team: "Commerce", environment: "stage", event: "Network policy risk accepted", result: "accepted risk", tone: "neutral" },
  { id: "evt-5", time: "08:57", service: "IDP Portal", team: "Developer Experience", environment: "dev", event: "Resource limit remediation started", result: "in progress", tone: "warning" },
  { id: "evt-6", time: "Yesterday", service: "Payments API", team: "Payments", environment: "prod", event: "PDB violation resolved", result: "compliant", tone: "success" }
];

export function severityTone(severity: PolicySeverity): StatusTone {
  if (severity === "critical" || severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "neutral";
}

export function postureTone(posture: CompliancePosture): StatusTone {
  if (posture === "compliant") {
    return "success";
  }

  if (posture === "critical") {
    return "danger";
  }

  if (posture === "warning") {
    return "warning";
  }

  return "neutral";
}

export function violationStatusTone(status: PolicyViolationStatus): StatusTone {
  if (status === "resolved") {
    return "success";
  }

  if (status === "open") {
    return "danger";
  }

  if (status === "in progress") {
    return "warning";
  }

  return "neutral";
}

export function getServicePolicySummary(serviceId: string) {
  return servicePolicyScorecards.find((scorecard) => scorecard.serviceId === serviceId);
}

export function getPolicyViolationsForService(serviceId: string) {
  return policyViolations.filter((violation) => violation.serviceId === serviceId);
}

export function getGovernanceDashboard() {
  const activeViolations = policyViolations.filter((violation) => violation.status !== "resolved");
  const overallScore = Math.round(servicePolicyScorecards.reduce((sum, item) => sum + item.score, 0) / servicePolicyScorecards.length);
  const severities: PolicySeverity[] = ["critical", "high", "medium", "low"];
  const violationsBySeverity = severities.map((severity) => ({
    severity,
    count: activeViolations.filter((violation) => violation.severity === severity).length
  }));

  return {
    overallScore,
    activeViolations,
    violationsBySeverity,
    violationsByTeam: teamComplianceSummaries,
    topRiskyServices: [...servicePolicyScorecards].sort((a, b) => a.score - b.score).slice(0, 4),
    recentPolicyEvents: policyEvents
  };
}
