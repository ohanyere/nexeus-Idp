import "server-only";

import { PLATFORM_DOCKER_HUB_NAMESPACE } from "@/lib/platform";
import { requireDatabase } from "@/lib/server/prisma";

export type PersistGeneratedServiceInput = {
 name: string;
 description: string;
 team: string;
 ownerEmail: string;
 template: string;
 environments: string[];
 capabilities: string[];
 visibility: string;
 dockerHubNamespace: string;
 estimatedMonthlyCost: number;
 repository: {
 url: string;
 name: string;
 owner: string;
 defaultBranch: string;
 };
};

const serviceInclude = {
 team: true,
 environments: true,
 capabilities: true,
 deployments: {
 orderBy: {
 deployedAt: "desc" as const
 }
 }
};

function toSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-team";
}

function formatTemplate(value: string) {
 const labels: Record<string, string> = {
 "go-api": "Go API",
 "node-api": "Node.js API",
 "python-api": "Python API",
 "nextjs-frontend": "Next.js Frontend",
 "worker-service": "Worker Service"
 };

 return labels[value] ?? value;
}

function environmentPriority(name: string) {
 if (name === "prod") {
 return 0;
 }

 if (name === "stage") {
 return 1;
 }

 if (name === "dev") {
 return 2;
 }

 return 3;
}

export async function listPersistedServices() {
 const db = requireDatabase();

 return db.service.findMany({
 include: serviceInclude,
 orderBy: {
 createdAt: "desc"
 }
 });
}

export async function getPersistedService(serviceId: string) {
 const db = requireDatabase();

 return db.service.findFirst({
 where: {
 OR: [
 { id: serviceId },
 { name: serviceId },
 { repositoryName: serviceId }
 ]
 },
 include: serviceInclude
 });
}

export async function persistGeneratedService(input: PersistGeneratedServiceInput) {
 const db = requireDatabase();
 const teamSlug = toSlug(input.team);
 const dockerHubNamespace = PLATFORM_DOCKER_HUB_NAMESPACE;
 const dockerImage = `${dockerHubNamespace}/${input.name}:latest`;
 const environmentNames = [...new Set(input.environments)];
 const capabilityNames = [...new Set(input.capabilities)];

 return db.$transaction(async (tx) => {
 const team = await tx.team.upsert({
 where: { slug: teamSlug },
 update: {},
 create: {
 name: input.team,
 slug: teamSlug,
 description: `${input.team} service ownership group.`
 }
 });

 const service = await tx.service.upsert({
 where: {
 name: input.name
 },
 update: {
 description: input.description,
 repositoryUrl: input.repository.url,
 repositoryOwner: input.repository.owner,
 repositoryName: input.repository.name,
 defaultBranch: input.repository.defaultBranch,
 dockerHubNamespace,
 dockerImage,
 template: input.template,
 visibility: input.visibility,
 ownerEmail: input.ownerEmail,
 estimatedMonthlyCost: Math.round(input.estimatedMonthlyCost),
 deploymentStatus: "Repository reconciled",
 teamId: team.id
 },
 create: {
 name: input.name,
 description: input.description,
 repositoryUrl: input.repository.url,
 repositoryOwner: input.repository.owner,
 repositoryName: input.repository.name,
 defaultBranch: input.repository.defaultBranch,
 dockerHubNamespace,
 dockerImage,
 template: input.template,
 visibility: input.visibility,
 ownerEmail: input.ownerEmail,
 estimatedMonthlyCost: Math.round(input.estimatedMonthlyCost),
 healthStatus: "Pending",
 deploymentStatus: "Repository generated",
 teamId: team.id,
 environments: {
 create: environmentNames.map((environment) => ({
 name: environment,
 currentVersion: "v0.1.0",
 status: "Pending"
 }))
 },
 capabilities: {
 create: capabilityNames.map((capability) => ({
 name: capability
 }))
 },
 auditLogs: {
 create: {
 action: "service.created",
 actor: input.ownerEmail || "IDP user",
 targetType: "service",
 targetName: input.name,
 message: `Created ${input.name} from ${formatTemplate(input.template)} and linked ${input.repository.owner}/${input.repository.name}.`,
 teamId: team.id
 }
 }
 },
 include: serviceInclude
 });

 for (const environment of environmentNames) {
 await tx.serviceEnvironment.upsert({
 where: {
 serviceId_name: {
 serviceId: service.id,
 name: environment
 }
 },
 update: {},
 create: {
 serviceId: service.id,
 name: environment,
 currentVersion: "v0.1.0",
 status: "Pending"
 }
 });
 }

 for (const capability of capabilityNames) {
 await tx.serviceCapability.upsert({
 where: {
 serviceId_name: {
 serviceId: service.id,
 name: capability
 }
 },
 update: {},
 create: {
 serviceId: service.id,
 name: capability
 }
 });
 }

 await tx.auditLog.create({
 data: {
 action: "service.reconciled",
 actor: input.ownerEmail || "IDP user",
 targetType: "service",
 targetName: input.name,
 message: `Reconciled ${input.name} catalog metadata with ${input.repository.owner}/${input.repository.name}.`,
 serviceId: service.id,
 teamId: team.id
 }
 });

 return tx.service.findUniqueOrThrow({
 where: {
 id: service.id
 },
 include: serviceInclude
 });
 });
}

export function toCatalogApiService(service: Awaited<ReturnType<typeof listPersistedServices>>[number]) {
 const sortedEnvironments = [...service.environments].sort((a, b) => environmentPriority(a.name) - environmentPriority(b.name));
 const currentEnvironment = sortedEnvironments[0];

 return {
 id: service.id,
 name: service.name,
 description: service.description,
 repositoryUrl: service.repositoryUrl,
 repositoryOwner: service.repositoryOwner,
 repositoryName: service.repositoryName,
 defaultBranch: service.defaultBranch,
 dockerHubNamespace: service.dockerHubNamespace,
 dockerImage: service.dockerImage,
 template: service.template,
 visibility: service.visibility,
 ownerEmail: service.ownerEmail,
 estimatedMonthlyCost: service.estimatedMonthlyCost,
 healthStatus: service.healthStatus,
 deploymentStatus: service.deploymentStatus,
 createdAt: service.createdAt.toISOString(),
 updatedAt: service.updatedAt.toISOString(),
 team: {
 id: service.team.id,
 name: service.team.name,
 slug: service.team.slug,
 description: service.team.description
 },
 environments: sortedEnvironments.map((environment) => ({
 id: environment.id,
 name: environment.name,
 currentVersion: environment.currentVersion,
 status: environment.status
 })),
 capabilities: service.capabilities.map((capability) => ({
 id: capability.id,
 name: capability.name
 })),
 deployments: service.deployments.map((deployment) => ({
 id: deployment.id,
 environment: deployment.environment,
 version: deployment.version,
 status: deployment.status,
 commitSha: deployment.commitSha,
 imageTag: deployment.imageTag,
 deployedBy: deployment.deployedBy,
 deployedAt: deployment.deployedAt.toISOString(),
 deploymentType: deployment.deploymentType
 })),
 currentVersion: currentEnvironment?.currentVersion ?? "v0.1.0"
 };
}
