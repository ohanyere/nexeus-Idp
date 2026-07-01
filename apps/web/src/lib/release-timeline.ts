import type { DeploymentLogGroup, DeploymentRecord, EnvironmentName, EnvironmentPromotion, StatusTone } from "@/lib/mock-data";
import { deployments, environmentPromotions } from "@/lib/mock-data";

export type ReleaseEventType =
  | "commit"
  | "ci"
  | "test"
  | "image"
  | "gitops"
  | "pr"
  | "argocd"
  | "rollout"
  | "rollback"
  | "provisioning"
  | "policy"
  | "audit";

export type ReleaseEventStatus = "succeeded" | "running" | "waiting" | "failed" | "warning" | "blocked" | "requested";

export type ReleaseTimelineEvent = {
  id: string;
  serviceId: string;
  deploymentId: string;
  release: string;
  environment: EnvironmentName;
  type: ReleaseEventType;
  label: string;
  detail: string;
  time: string;
  status: ReleaseEventStatus;
  tone: StatusTone;
  source: "GitHub" | "GitOps" | "ArgoCD" | "Argo Rollouts" | "Rollback" | "Cluster" | "Crossplane" | "Kyverno" | "Audit" | "Mock";
  commit?: string;
  image?: string;
  prUrl?: string;
};

export type ReleaseLogSource = "github-actions" | "argocd" | "rollout";

export type ReleaseLogGroup = {
  id: string;
  serviceId: string;
  deploymentId: string;
  release: string;
  environment: EnvironmentName;
  source: ReleaseLogSource;
  title: string;
  status: ReleaseEventStatus;
  tone: StatusTone;
  lines: string[];
};

type PromotionMatch = {
  promotion?: EnvironmentPromotion;
  prUrl?: string;
  mergeStatus?: string;
};

const releaseEventOrder: ReleaseEventType[] = ["commit", "ci", "test", "image", "gitops", "pr", "argocd", "rollout", "provisioning", "policy", "audit", "rollback"];

export function getReleaseTimelineForService(serviceId: string) {
  const serviceDeployments = deployments.filter((deployment) => deployment.serviceId === serviceId);

  return {
    events: sortEvents(serviceDeployments.flatMap(createReleaseEvents)),
    logs: serviceDeployments.flatMap(createReleaseLogs)
  };
}

export function getReleaseTimelineForDeployment(deploymentId: string) {
  const deployment = deployments.find((item) => item.id === deploymentId);

  if (!deployment) {
    return { events: [], logs: [] };
  }

  return {
    events: createReleaseEvents(deployment),
    logs: createReleaseLogs(deployment)
  };
}

export function releaseEventTypeLabel(type: ReleaseEventType) {
  const labels: Record<ReleaseEventType, string> = {
    commit: "Commit",
    ci: "CI",
    test: "Tests",
    image: "Image",
    gitops: "GitOps",
    pr: "PR",
    argocd: "ArgoCD",
    rollout: "Rollout",
    rollback: "Rollback",
    provisioning: "Provisioning",
    policy: "Policy",
    audit: "Audit"
  };

  return labels[type];
}

export function releaseLogSourceLabel(source: ReleaseLogSource) {
  const labels: Record<ReleaseLogSource, string> = {
    "github-actions": "GitHub Actions",
    argocd: "ArgoCD",
    rollout: "Rollout Events"
  };

  return labels[source];
}

function createReleaseEvents(deployment: DeploymentRecord): ReleaseTimelineEvent[] {
  const promotionMatch = findPromotionMatch(deployment);
  const buildFailed = deployment.status.toLowerCase().includes("failed") || deployment.githubActionsStatus.toLowerCase().includes("failed");
  const waiting = deployment.githubActionsStatus.toLowerCase().includes("running") || deployment.rolloutStatus.toLowerCase().includes("building");
  const rolloutFailed = deployment.rolloutStatus.toLowerCase().includes("failed");
  const rollbackReady = deployment.status.toLowerCase().includes("rollback");
  const prUrl = promotionMatch.prUrl;

  const base: Array<Omit<ReleaseTimelineEvent, "id" | "serviceId" | "deploymentId" | "release" | "environment">> = [
    {
      type: "commit",
      label: "Commit pushed",
      detail: `${deployment.commit} pushed for ${deployment.service} ${deployment.version}.`,
      time: deployment.deployedAt,
      status: "succeeded",
      tone: "success",
      source: "GitHub",
      commit: deployment.commit
    },
    {
      type: "ci",
      label: "CI started",
      detail: `GitHub Actions workflow started for ${deployment.commit}.`,
      time: firstTimelineTime(deployment, "Build") ?? deployment.deployedAt,
      status: waiting ? "running" : buildFailed ? "failed" : "succeeded",
      tone: waiting ? "info" : buildFailed ? "danger" : "success",
      source: "GitHub",
      commit: deployment.commit
    },
    {
      type: "test",
      label: "Tests passed",
      detail: deployment.logs.githubActions.lines.find((line) => line.toLowerCase().includes("test")) ?? "Automated test suite completed.",
      time: firstTimelineTime(deployment, "Build") ?? deployment.deployedAt,
      status: buildFailed ? "failed" : waiting ? "waiting" : "succeeded",
      tone: buildFailed ? "danger" : waiting ? "neutral" : "success",
      source: "GitHub"
    },
    {
      type: "image",
      label: "Docker image built",
      detail: `${deployment.image} built for ${deployment.environment}.`,
      time: firstTimelineTime(deployment, "Image") ?? firstTimelineTime(deployment, "Build") ?? deployment.deployedAt,
      status: waiting ? "waiting" : buildFailed ? "failed" : "succeeded",
      tone: waiting ? "neutral" : buildFailed ? "danger" : "success",
      source: "GitHub",
      image: deployment.image
    },
    {
      type: "image",
      label: "Image pushed",
      detail: `${deployment.image} pushed to Docker Hub.`,
      time: firstTimelineTime(deployment, "Image") ?? deployment.deployedAt,
      status: waiting ? "waiting" : buildFailed ? "failed" : "succeeded",
      tone: waiting ? "neutral" : buildFailed ? "danger" : "success",
      source: "GitHub",
      image: deployment.image
    },
    {
      type: "gitops",
      label: "Dev overlay updated",
      detail: `GitOps image tag updated to ${deployment.commit}.`,
      time: firstPromotionTime(promotionMatch.promotion, "Deployed Dev") ?? deployment.deployedAt,
      status: waiting ? "waiting" : buildFailed ? "blocked" : "succeeded",
      tone: waiting ? "neutral" : buildFailed ? "warning" : "success",
      source: "GitOps",
      commit: deployment.commit
    },
    {
      type: "pr",
      label: "Promotion PR created",
      detail: prUrl ? `Promotion PR opened: ${prUrl}` : "No promotion PR required for this release path.",
      time: firstPromotionTime(promotionMatch.promotion, "PR Created") ?? deployment.deployedAt,
      status: prUrl ? "succeeded" : "waiting",
      tone: prUrl ? "info" : "neutral",
      source: "GitHub",
      prUrl
    },
    {
      type: "pr",
      label: "PR merged",
      detail: promotionMatch.mergeStatus === "merged" ? "Promotion PR merged and GitOps desired state changed." : "Promotion PR has not merged.",
      time: firstPromotionTime(promotionMatch.promotion, "Merged") ?? deployment.deployedAt,
      status: promotionMatch.mergeStatus === "merged" ? "succeeded" : promotionMatch.mergeStatus === "rejected" ? "failed" : "waiting",
      tone: promotionMatch.mergeStatus === "merged" ? "success" : promotionMatch.mergeStatus === "rejected" ? "danger" : "neutral",
      source: "GitHub",
      prUrl
    },
    {
      type: "argocd",
      label: "ArgoCD synced",
      detail: deployment.logs.argoCd.lines.join(" · "),
      time: firstTimelineTime(deployment, "ArgoCD") ?? deployment.deployedAt,
      status: deployment.argoCdSyncStatus.toLowerCase().includes("failed") ? "failed" : deployment.argoCdSyncStatus.toLowerCase().includes("out of sync") ? "warning" : waiting ? "waiting" : "succeeded",
      tone: deployment.argoCdSyncStatus.toLowerCase().includes("failed") ? "danger" : deployment.argoCdSyncStatus.toLowerCase().includes("out of sync") ? "drift" : waiting ? "neutral" : "success",
      source: "ArgoCD"
    },
    {
      type: "rollout",
      label: "Rollout started",
      detail: `${deployment.rolloutStrategy} rollout started for ${deployment.version}.`,
      time: firstTimelineTime(deployment, "Canary") ?? deployment.deployedAt,
      status: rolloutFailed ? "failed" : waiting ? "running" : "succeeded",
      tone: rolloutFailed ? "danger" : waiting ? "info" : "success",
      source: "Argo Rollouts"
    },
    {
      type: "rollout",
      label: "Rollout healthy",
      detail: deployment.rolloutStatus.toLowerCase().includes("completed") ? "Rollout completed and health checks passed." : `Rollout status: ${deployment.rolloutStatus}.`,
      time: firstTimelineTime(deployment, "Deployment") ?? deployment.deployedAt,
      status: rolloutFailed ? "failed" : rollbackReady ? "warning" : waiting ? "waiting" : "succeeded",
      tone: rolloutFailed ? "danger" : rollbackReady ? "warning" : waiting ? "neutral" : "success",
      source: "Argo Rollouts"
    }
  ];

  if (rollbackReady) {
    base.push({
      type: "rollback",
      label: "Rollback requested",
      detail: `${deployment.previousStableVersions[0]?.version ?? "Previous stable version"} selected as rollback target.`,
      time: deployment.deployedAt,
      status: "requested",
      tone: "warning",
      source: "Rollback"
    });
  }

  return base.map((event, index) => ({
    ...event,
    id: `${deployment.id}-${event.type}-${index}`,
    serviceId: deployment.serviceId,
    deploymentId: deployment.id,
    release: deployment.version,
    environment: deployment.environment
  }));
}

function createReleaseLogs(deployment: DeploymentRecord): ReleaseLogGroup[] {
  return [
    mapLogGroup(deployment, "github-actions", deployment.logs.githubActions, deployment.githubActionsStatus),
    mapLogGroup(deployment, "argocd", deployment.logs.argoCd, deployment.argoCdSyncStatus),
    mapLogGroup(deployment, "rollout", deployment.logs.argoRollouts, deployment.rolloutStatus)
  ];
}

function mapLogGroup(deployment: DeploymentRecord, source: ReleaseLogSource, group: DeploymentLogGroup, status: string): ReleaseLogGroup {
  const tone = statusToneFromText(status);

  return {
    id: `${deployment.id}-${source}`,
    serviceId: deployment.serviceId,
    deploymentId: deployment.id,
    release: deployment.version,
    environment: deployment.environment,
    source,
    title: group.title,
    status: tone === "danger" ? "failed" : tone === "warning" || tone === "drift" ? "warning" : tone === "info" ? "running" : "succeeded",
    tone,
    lines: group.lines
  };
}

function findPromotionMatch(deployment: DeploymentRecord): PromotionMatch {
  const promotion = environmentPromotions.find((candidate) => candidate.serviceId === deployment.serviceId);
  const history = promotion?.history.find((item) => item.version === deployment.version || item.sha === deployment.commit || item.to === deployment.environment);

  return {
    promotion,
    prUrl: history?.prUrl,
    mergeStatus: history?.mergeStatus
  };
}

function firstTimelineTime(deployment: DeploymentRecord, eventName: string) {
  return deployment.timeline.find((event) => event.event.toLowerCase().includes(eventName.toLowerCase()))?.time;
}

function firstPromotionTime(promotion: EnvironmentPromotion | undefined, eventName: string) {
  return promotion?.timeline.find((event) => event.event.toLowerCase().includes(eventName.toLowerCase()))?.time;
}

function sortEvents(events: ReleaseTimelineEvent[]) {
  return [...events].sort((a, b) => {
    const releaseCompare = b.release.localeCompare(a.release);

    if (releaseCompare !== 0) {
      return releaseCompare;
    }

    return releaseEventOrder.indexOf(a.type) - releaseEventOrder.indexOf(b.type);
  });
}

function statusToneFromText(status: string): StatusTone {
  const lower = status.toLowerCase();

  if (lower.includes("fail") || lower.includes("blocked")) {
    return "danger";
  }

  if (lower.includes("warning") || lower.includes("paused") || lower.includes("out of sync") || lower.includes("degraded")) {
    return lower.includes("out of sync") ? "drift" : "warning";
  }

  if (lower.includes("running") || lower.includes("building") || lower.includes("prepared")) {
    return "info";
  }

  if (lower.includes("succeeded") || lower.includes("synced") || lower.includes("completed")) {
    return "success";
  }

  return "neutral";
}
