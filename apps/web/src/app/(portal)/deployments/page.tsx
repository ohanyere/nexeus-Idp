import {
 ReleaseManagementConsole,
 type ReleaseConsoleAuditItem,
 type ReleaseConsoleEnvironment,
 type ReleaseConsoleItem,
 type ReleaseConsoleTimelineItem
} from "@/components/ReleaseManagementConsole";
import { auditLogs, environmentPromotions, getServiceById } from "@/lib/mock-data";
import type { StatusTone } from "@/lib/mock-data";
import { listPersistedServices } from "@/lib/server/catalog";
import {
 createPromotionService,
 type EnvironmentReleaseState,
 type ReleaseSnapshot
} from "@/lib/server/promotion-service";
import { statusTone } from "@/lib/status";

export const dynamic = "force-dynamic";

type ReleaseEnvironmentName = "dev" | "stage" | "prod";

type RealDeploymentRelease = {
 serviceId: string;
 serviceName: string;
 teamName: string;
 repositoryOwner: string;
 repositoryName: string;
 repositoryUrl: string;
 defaultBranch: string;
 environments: Array<EnvironmentReleaseState & { tone: StatusTone }>;
 openPullRequests: ReleaseSnapshot["openPullRequests"];
 warning?: string;
};

const releaseEnvironmentNames: ReleaseEnvironmentName[] = ["dev", "stage", "prod"];

function fallbackEnvironment(environment: ReleaseEnvironmentName): EnvironmentReleaseState & { tone: StatusTone } {
 return {
  environment,
  sha: "unknown",
  overlayPath: `k8s/overlays/${environment}/kustomization.yaml`,
  status: "unknown",
  tone: "warning"
 };
}

function releaseEnvironment(snapshot: ReleaseSnapshot | null, environment: ReleaseEnvironmentName) {
 const fromSnapshot = snapshot?.environments.find((candidate) => candidate.environment === environment);

 if (!fromSnapshot) {
  return fallbackEnvironment(environment);
 }

 return {
  ...fromSnapshot,
  tone: statusTone(fromSnapshot.status)
 };
}

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "Unable to load release state.";
}

async function loadRealDeploymentReleases() {
 try {
  const services = await listPersistedServices();

  if (services.length === 0) {
   return {
    releases: [] as RealDeploymentRelease[],
    warning: undefined
   };
  }

  let promotionService: ReturnType<typeof createPromotionService> | null = null;
  let serviceWarning: string | undefined;

  try {
   promotionService = createPromotionService();
  } catch (error) {
   serviceWarning = getErrorMessage(error);
  }

  const releases = await Promise.all(services.map(async (service) => {
   let snapshot: ReleaseSnapshot | null = null;
   let warning = serviceWarning;

   if (promotionService) {
    try {
     snapshot = await promotionService.getReleaseSnapshot({
      service: service.name,
      owner: service.repositoryOwner,
      repo: service.repositoryName
     });
    } catch (error) {
     warning = getErrorMessage(error);
    }
   }

   return {
    serviceId: service.name,
    serviceName: service.name,
    teamName: service.team.name,
    repositoryOwner: service.repositoryOwner,
    repositoryName: service.repositoryName,
    repositoryUrl: service.repositoryUrl,
    defaultBranch: snapshot?.defaultBranch ?? service.defaultBranch,
    environments: releaseEnvironmentNames.map((environment) => releaseEnvironment(snapshot, environment)),
    openPullRequests: snapshot?.openPullRequests ?? [],
    warning
   };
  }));

  return {
   releases,
   warning: undefined
  };
 } catch (error) {
  return {
   releases: [] as RealDeploymentRelease[],
   warning: getErrorMessage(error)
  };
 }
}

function toReleaseEnvironment(environment: EnvironmentReleaseState & { tone: StatusTone }): ReleaseConsoleEnvironment {
 return {
  environment: environment.environment,
  sha: environment.sha,
  overlayPath: environment.overlayPath,
  status: environment.status,
  tone: environment.tone
 };
}

function auditEventsFor(serviceName: string, repositoryName: string): ReleaseConsoleAuditItem[] {
 const normalizedService = serviceName.toLowerCase();
 const normalizedRepository = repositoryName.toLowerCase();

 return auditLogs.filter((event) => {
  const target = event.target.toLowerCase();
  return target.includes(normalizedService) || target.includes(normalizedRepository);
 });
}

function releaseTimelineFor(release: RealDeploymentRelease): ReleaseConsoleTimelineItem[] {
 const pullRequestEvents = release.openPullRequests.map((pullRequest) => ({
  event: pullRequest.title,
  environment: pullRequest.head.includes("/prod/") ? "prod" : pullRequest.head.includes("/stage/") ? "stage" : "release",
  time: `PR #${pullRequest.number}`,
  status: pullRequest.state,
  tone: statusTone(pullRequest.state)
 }));
 const environmentEvents = release.environments.map((environment) => ({
  event: `${environment.environment} overlay read`,
  environment: environment.environment,
  time: release.defaultBranch,
  status: environment.status,
  tone: environment.tone
 }));

 return [...pullRequestEvents, ...environmentEvents];
}

function realReleaseToConsoleItem(release: RealDeploymentRelease): ReleaseConsoleItem {
 return {
  serviceId: release.serviceId,
  serviceName: release.serviceName,
  teamName: release.teamName,
  repositoryOwner: release.repositoryOwner,
  repositoryName: release.repositoryName,
  repositoryUrl: release.repositoryUrl,
  defaultBranch: release.defaultBranch,
  environments: release.environments.map(toReleaseEnvironment),
  openPullRequests: release.openPullRequests,
  warning: release.warning,
  history: [],
  timeline: releaseTimelineFor(release),
  auditEvents: auditEventsFor(release.serviceName, release.repositoryName),
  source: "catalog"
 };
}

function mockReleaseToConsoleItem(promotion: (typeof environmentPromotions)[number]): ReleaseConsoleItem {
 const service = getServiceById(promotion.serviceId);

 return {
  serviceId: promotion.serviceId,
  serviceName: service?.name ?? promotion.serviceId,
  teamName: service?.team ?? "Platform team",
  repositoryOwner: promotion.repositoryOwner,
  repositoryName: promotion.repositoryName,
  repositoryUrl: `https://github.com/${promotion.repositoryOwner}/${promotion.repositoryName}`,
  defaultBranch: "main",
  environments: promotion.environments.map((environment) => ({
   environment: environment.environment,
   sha: environment.sha,
   overlayPath: `k8s/overlays/${environment.environment}/kustomization.yaml`,
   status: environment.status,
   tone: environment.tone
  })),
  openPullRequests: promotion.history
  .filter((event) => event.mergeStatus === "open" && event.prUrl)
  .map((event, index) => ({
   number: Number(event.prUrl?.split("/").pop() ?? index + 1),
   title: `${event.from} to ${event.to} ${event.sha}`,
   url: event.prUrl ?? "",
   head: `promote/${promotion.serviceId}/${event.to}/${event.sha}`,
   base: "main",
   state: "open"
  })),
  history: promotion.history,
  timeline: promotion.timeline,
  auditEvents: auditEventsFor(service?.name ?? promotion.serviceId, promotion.repositoryName),
  source: "demo"
 };
}

export default async function DeploymentsPage() {
 const { releases, warning } = await loadRealDeploymentReleases();
 const consoleReleases = releases.length > 0
  ? releases.map(realReleaseToConsoleItem)
  : environmentPromotions.map(mockReleaseToConsoleItem);

 return <ReleaseManagementConsole releases={consoleReleases} warning={warning} />;
}
