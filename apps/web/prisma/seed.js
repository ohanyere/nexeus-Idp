const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const githubOwner = process.env.GITHUB_ORG?.trim() || process.env.GITHUB_OWNER?.trim() || "ohanyere";

function githubUrl(repo) {
 return `https://github.com/${githubOwner}/${repo}`;
}

async function main() {
 const platform = await prisma.team.upsert({
 where: { slug: "platform-engineering" },
 update: {},
 create: {
 name: "Platform Engineering",
 slug: "platform-engineering",
 description: "Owns IDP foundations, golden paths, governance, and developer experience."
 }
 });

 const payments = await prisma.team.upsert({
 where: { slug: "payments" },
 update: {},
 create: {
 name: "Payments",
 slug: "payments",
 description: "Owns payment authorization, capture, refund, and provider webhook services."
 }
 });

 await prisma.user.upsert({
 where: { email: "avery.morgan@example.com" },
 update: {},
 create: { name: "Avery Morgan", email: "avery.morgan@example.com", role: "Platform Admin" }
 });

 await prisma.user.upsert({
 where: { email: "maya.chen@example.com" },
 update: {},
 create: { name: "Maya Chen", email: "maya.chen@example.com", role: "Team Lead" }
 });

 const paymentsApi = await prisma.service.upsert({
 where: { name: "payments-api" },
 update: {
 repositoryUrl: githubUrl("payments-api"),
 repositoryOwner: githubOwner,
 repositoryName: "payments-api"
 },
 create: {
 name: "payments-api",
 description: "Handles payment authorization, capture, refund orchestration, and provider webhooks.",
 repositoryUrl: githubUrl("payments-api"),
 repositoryOwner: githubOwner,
 repositoryName: "payments-api",
 defaultBranch: "main",
 dockerHubNamespace: "kuberpull",
 dockerImage: "kuberpull/payments-api:latest",
 template: "go-api",
 visibility: "private",
 ownerEmail: "payments-platform@example.com",
 estimatedMonthlyCost: 12860,
 healthStatus: "Healthy",
 deploymentStatus: "Deployed",
 teamId: payments.id,
 environments: {
 create: [
 { name: "dev", currentVersion: "v1.18.4", status: "Ready" },
 { name: "stage", currentVersion: "v1.18.4", status: "Ready" },
 { name: "prod", currentVersion: "v1.18.4", status: "Ready" }
 ]
 },
 capabilities: {
 create: [{ name: "postgresql" }, { name: "monitoring" }, { name: "logs" }]
 },
 deployments: {
 create: [{
 environment: "prod",
 version: "v1.18.4",
 status: "Healthy",
 commitSha: "9ad31c2",
 imageTag: "docker.io/kuberpull/payments-api:1.18.4",
 deployedBy: "Maya Chen",
 deployedAt: new Date("2026-06-11T09:18:00.000Z"),
 deploymentType: "promotion from stage"
 }]
 }
 }
 });

 const portal = await prisma.service.upsert({
 where: { name: "idp-portal" },
 update: {
 repositoryUrl: githubUrl("idp-portal"),
 repositoryOwner: githubOwner,
 repositoryName: "idp-portal"
 },
 create: {
 name: "idp-portal",
 description: "Developer portal for catalog, deployments, golden paths, governance, and operational visibility.",
 repositoryUrl: githubUrl("idp-portal"),
 repositoryOwner: githubOwner,
 repositoryName: "idp-portal",
 defaultBranch: "main",
 dockerHubNamespace: "kuberpull",
 dockerImage: "kuberpull/idp-portal:latest",
 template: "nextjs-frontend",
 visibility: "private",
 ownerEmail: "devex@example.com",
 estimatedMonthlyCost: 3220,
 healthStatus: "Healthy",
 deploymentStatus: "Building",
 teamId: platform.id,
 environments: {
 create: [{ name: "dev", currentVersion: "v0.1.0", status: "Ready" }]
 },
 capabilities: {
 create: [{ name: "monitoring" }, { name: "logs" }]
 },
 deployments: {
 create: [{
 environment: "dev",
 version: "v0.1.0",
 status: "Building",
 commitSha: "2f18a90",
 imageTag: "docker.io/kuberpull/idp-portal:0.1.0",
 deployedBy: "Avery Morgan",
 deployedAt: new Date("2026-06-10T18:00:00.000Z"),
 deploymentType: "direct deploy"
 }]
 }
 }
 });

 await prisma.auditLog.createMany({
 data: [
 {
 action: "service.seeded",
 actor: "Prisma seed",
 targetType: "service",
 targetName: paymentsApi.name,
 message: "Seeded Payments API catalog record.",
 serviceId: paymentsApi.id,
 teamId: payments.id
 },
 {
 action: "service.seeded",
 actor: "Prisma seed",
 targetType: "service",
 targetName: portal.name,
 message: "Seeded IDP Portal catalog record.",
 serviceId: portal.id,
 teamId: platform.id
 }
 ],
 skipDuplicates: true
 });
}

main()
 .then(async () => {
 await prisma.$disconnect();
 })
 .catch(async (error) => {
 console.error(error);
 await prisma.$disconnect();
 process.exit(1);
 });
