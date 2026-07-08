import { NextResponse } from "next/server";

import { UnsupportedTemplateError, normalizeTemplate } from "@/lib/github-template";
import { PLATFORM_DOCKER_HUB_NAMESPACE } from "@/lib/platform";
import { persistGeneratedService, toCatalogApiService } from "@/lib/server/catalog";
import {
 GitHubActionsSecretError,
 GitHubConfigurationError,
 GitHubRepositoryNotReadyError,
 GitHubTemplatePersonalizationError,
 createGitHubService,
 type RepositoryReadinessResult,
 type PersonalizeRepositoryTemplateResult
} from "@/lib/server/github";
import { DatabaseConfigurationError } from "@/lib/server/prisma";

type CreateServiceRequest = {
 name?: unknown;
 description?: unknown;
 team?: unknown;
 ownerEmail?: unknown;
 template?: unknown;
 environments?: unknown;
 capabilities?: unknown;
 visibility?: unknown;
 estimatedMonthlyCost?: unknown;
 costCenter?: unknown;
};

type StepStatus = "success" | "warning" | "failed" | "skipped";

type WorkflowStep = {
 status: StepStatus;
 message: string;
 details?: unknown;
};

type CreateServiceSteps = {
 repository: WorkflowStep;
 fleetDiscovery: WorkflowStep;
 personalization: WorkflowStep;
 secrets: WorkflowStep;
 fleetRegistry: WorkflowStep;
 catalog: WorkflowStep;
};

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const supportedEnvironments = new Set(["dev", "stage", "prod"]);
const supportedVisibility = new Set(["private", "public"]);

function jsonError(message: string, status: number, details?: string[]) {
 return NextResponse.json(
 {
 error: message,
 details
 },
 { status }
 );
}

function stringValue(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
 if (!Array.isArray(value)) {
 return [];
 }

 return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function validateRequest(body: CreateServiceRequest) {
 const errors: string[] = [];
 const name = stringValue(body.name);
 const description = stringValue(body.description);
 const team = stringValue(body.team);
 const ownerEmail = stringValue(body.ownerEmail);
 const templateValue = stringValue(body.template);
 const environments = stringArray(body.environments);
 const capabilities = stringArray(body.capabilities);
 const visibility = stringValue(body.visibility) || "private";
 const dockerHubNamespace = PLATFORM_DOCKER_HUB_NAMESPACE;
 const estimatedMonthlyCost = typeof body.estimatedMonthlyCost === "number" ? body.estimatedMonthlyCost : Number(body.estimatedMonthlyCost ?? 0);
 const costCenter = stringValue(body.costCenter);

 if (!name) {
 errors.push("Service name is required.");
 } else if (!kebabCasePattern.test(name)) {
 errors.push("Service name must use lowercase kebab-case, for example payment-api.");
 }

 if (!team) {
 errors.push("Team is required.");
 }

 if (!templateValue) {
 errors.push("Template is required.");
 }

 if (environments.length === 0) {
 errors.push("At least one environment is required.");
 } else if (environments.some((environment) => !supportedEnvironments.has(environment))) {
 errors.push("Environments must be one of dev, stage, or prod.");
 }

 if (!supportedVisibility.has(visibility)) {
 errors.push("Visibility must be private or public.");
 }

 if (!Number.isFinite(estimatedMonthlyCost) || estimatedMonthlyCost < 0) {
 errors.push("Estimated monthly cost must be a non-negative number.");
 }

 let template;
 if (templateValue) {
 try {
 template = normalizeTemplate(templateValue);
 } catch (error) {
 if (error instanceof UnsupportedTemplateError) {
 errors.push(error.message);
 } else {
 throw error;
 }
 }
 }

 return {
 data: {
 name,
 description,
 team,
 ownerEmail,
 template,
 environments,
 capabilities,
 visibility,
 dockerHubNamespace,
 estimatedMonthlyCost,
 costCenter
 },
 errors
 };
}

function buildMockRepository(name: string) {
 const owner = process.env.GITHUB_ORG?.trim() || process.env.GITHUB_OWNER?.trim() || "github-owner-not-configured";

 return {
 url: `https://github.com/${owner}/${name}`,
 name,
 owner,
 defaultBranch: "main"
 };
}

function joinWarnings(warnings: Array<string | undefined>) {
 return warnings.filter(Boolean).join(" ");
}

function toSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-team";
}

function buildFleetDiscoveryTopics(teamName: string) {
 return [
 "idp-managed-service",
 "idp-template-node-api",
 `team-${toSlug(teamName)}`
 ];
}

function createInitialSteps(): CreateServiceSteps {
 return {
 repository: {
 status: "skipped",
 message: "Repository creation has not started."
 },
 fleetDiscovery: {
 status: "skipped",
 message: "Fleet discovery waits for the repository."
 },
 personalization: {
 status: "skipped",
 message: "Personalization waits for the repository."
 },
 secrets: {
 status: "skipped",
 message: "CI secrets wait for the repository."
 },
 fleetRegistry: {
 status: "skipped",
 message: "Fleet registry waits for repository enrichment."
 },
 catalog: {
 status: "skipped",
 message: "Catalog persistence waits for the repository."
 }
 };
}

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "Unknown error.";
}

function logDevelopmentStepError(step: keyof CreateServiceSteps, error: unknown) {
 if (process.env.NODE_ENV !== "development") {
 return;
 }

 if (error instanceof Error) {
 console.error(`[create-service:${step}]`, error.stack ?? error.message);
 return;
 }

 console.error(`[create-service:${step}]`, error);
}

function isCriticalWorkflowSuccess(steps: CreateServiceSteps) {
 return steps.repository.status === "success" && steps.personalization.status === "success" && steps.catalog.status === "success";
}

function hasWorkflowWarning(steps: CreateServiceSteps) {
 return Object.values(steps).some((step) => step.status === "warning" || step.status === "failed");
}

function applyPersonalizationDiagnostics(
 personalization: PersonalizeRepositoryTemplateResult,
 diagnostics: Partial<RepositoryReadinessResult> | undefined
) {
 personalization.defaultBranch = diagnostics?.defaultBranch;
 personalization.readyCommitSha = diagnostics?.readyCommitSha;
 personalization.readyTreeSha = diagnostics?.readyTreeSha;
 personalization.treeFileCount = diagnostics?.treeFileCount;
 personalization.attemptsUsed = diagnostics?.attemptsUsed;
}

export async function POST(request: Request) {
 let body: CreateServiceRequest;

 try {
 body = await request.json();
 } catch {
 return jsonError("Request body must be valid JSON.", 400);
 }

 const validation = validateRequest(body);

 if (validation.errors.length > 0 || !validation.data.template) {
 return jsonError("Invalid service creation request.", 400, validation.errors);
 }

 const steps = createInitialSteps();

 try {
 const github = createGitHubService();
 let repository;

 try {
 const repositoryResult = await github.generateOrGetRepositoryFromTemplate({
 name: validation.data.name,
 description: validation.data.description,
 template: validation.data.template,
 private: validation.data.visibility === "private"
 });
 repository = repositoryResult.repository;
 steps.repository = {
 status: "success",
 message: repositoryResult.alreadyExisted
 ? "Repository already exists; continuing reconciliation."
 : "Repository created from template.",
 details: {
 owner: repository.owner,
 name: repository.name,
 url: repository.url,
 defaultBranch: repository.defaultBranch,
 alreadyExisted: repositoryResult.alreadyExisted
 }
 };
 } catch (repositoryError) {
 logDevelopmentStepError("repository", repositoryError);
 steps.repository = {
 status: "failed",
 message: `Repository setup failed: ${getErrorMessage(repositoryError)}`
 };

 return NextResponse.json(
 {
 mode: "github",
 error: steps.repository.message,
 service: validation.data,
 steps
 },
 { status: 502 }
 );
 }

 try {
 const topicsResult = await github.addRepositoryTopics(repository.name, buildFleetDiscoveryTopics(validation.data.team));
 steps.fleetDiscovery = {
 status: "success",
 message: "Fleet discovery configured.",
 details: {
 topics: topicsResult.topics
 }
 };
 } catch (topicError) {
 logDevelopmentStepError("fleetDiscovery", topicError);
 steps.fleetDiscovery = {
 status: "warning",
 message: `Fleet discovery topic setup failed: ${getErrorMessage(topicError)}`
 };
 }

 let personalization: PersonalizeRepositoryTemplateResult = {
 updatedFilePaths: [],
 scannedFileCount: 0,
 safeFileCount: 0,
 personalizedFileCount: 0,
 remainingPlaceholderFilePaths: [],
 placeholdersReplaced: false,
 defaultBranch: undefined,
 readyCommitSha: undefined,
 readyTreeSha: undefined,
 treeFileCount: undefined,
 attemptsUsed: undefined,
 warning: undefined
 };

 try {
 const readiness = await github.waitForRepositoryReady(repository.name);
 repository.defaultBranch = readiness.defaultBranch;
 personalization = await github.personalizeRepositoryTemplate({
 repo: repository.name,
 serviceName: validation.data.name,
 teamName: validation.data.team,
 ownerEmail: validation.data.ownerEmail,
 environment: validation.data.environments.includes("dev") ? "dev" : validation.data.environments[0],
 costCenter: validation.data.costCenter,
 readiness
 });
 steps.personalization = {
 status: personalization.remainingPlaceholderFilePaths.length > 0 ? "failed" : "success",
 message: personalization.remainingPlaceholderFilePaths.length > 0
 ? `Template personalization left placeholders in ${personalization.remainingPlaceholderFilePaths.length} file(s).`
 : `Template placeholders replaced across ${personalization.personalizedFileCount} file(s).`,
 details: {
 scannedFileCount: personalization.scannedFileCount,
 safeFileCount: personalization.safeFileCount,
 personalizedFileCount: personalization.personalizedFileCount,
 remainingPlaceholderFilePaths: personalization.remainingPlaceholderFilePaths,
 defaultBranch: personalization.defaultBranch,
 readyCommitSha: personalization.readyCommitSha,
 readyTreeSha: personalization.readyTreeSha,
 treeFileCount: personalization.treeFileCount,
 attemptsUsed: personalization.attemptsUsed
 }
 };
 } catch (personalizationError) {
 logDevelopmentStepError("personalization", personalizationError);
 const personalizationMessage = personalizationError instanceof GitHubRepositoryNotReadyError
 ? "Repository was created, but GitHub did not finish preparing template files in time. Retry Create Service to reconcile."
 : personalizationError instanceof GitHubTemplatePersonalizationError
 ? personalizationError.message
 : getErrorMessage(personalizationError);

 personalization.warning = personalizationMessage;
 if (personalizationError instanceof GitHubRepositoryNotReadyError) {
 applyPersonalizationDiagnostics(personalization, personalizationError.diagnostics);
 }
 if (personalizationError instanceof GitHubTemplatePersonalizationError) {
 applyPersonalizationDiagnostics(personalization, personalizationError.diagnostics);
 }
 steps.personalization = {
 status: personalizationError instanceof GitHubRepositoryNotReadyError ? "warning" : "failed",
 message: personalization.warning,
 details: {
 scannedFileCount: personalization.scannedFileCount,
 safeFileCount: personalization.safeFileCount,
 personalizedFileCount: personalization.personalizedFileCount,
 remainingPlaceholderFilePaths: personalization.remainingPlaceholderFilePaths,
 defaultBranch: personalization.defaultBranch,
 readyCommitSha: personalization.readyCommitSha,
 readyTreeSha: personalization.readyTreeSha,
 treeFileCount: personalization.treeFileCount,
 attemptsUsed: personalization.attemptsUsed
 }
 };
 }

 let ciSecrets = {
 configured: false,
 configuredSecretNames: [] as string[],
 warning: undefined as string | undefined
 };

 try {
 const secretResult = await github.configureDockerHubActionsSecrets(repository.name);
 ciSecrets = {
 configured: true,
 configuredSecretNames: secretResult.configuredSecretNames,
 warning: undefined
 };
 steps.secrets = {
 status: "success",
 message: "Docker Hub CI secrets configured.",
 details: {
 configuredSecretNames: secretResult.configuredSecretNames
 }
 };
 } catch (secretError) {
 logDevelopmentStepError("secrets", secretError);
 const secretMessage = secretError instanceof GitHubConfigurationError
 ? "Platform Docker Hub secrets are not configured in the IDP environment."
 : secretError instanceof GitHubActionsSecretError
 ? secretError.message
 : getErrorMessage(secretError);

 ciSecrets = {
 configured: false,
 configuredSecretNames: [],
 warning: secretMessage
 };
 steps.secrets = {
 status: "warning",
 message: secretMessage
 };
 }

 try {
 const fleetRegistryResult = await github.registerServiceInFleetRegistry(validation.data.name);
 steps.fleetRegistry = {
 status: "success",
 message: "Fleet registry registered.",
 details: {
 owner: fleetRegistryResult.owner,
 repo: fleetRegistryResult.repo,
 branch: fleetRegistryResult.branch,
 files: fleetRegistryResult.files
 }
 };
 } catch (fleetRegistryError) {
 logDevelopmentStepError("fleetRegistry", fleetRegistryError);
 steps.fleetRegistry = {
 status: "warning",
 message: `Fleet registry registration failed: ${getErrorMessage(fleetRegistryError)}`
 };
 }

 let service;

 try {
 service = await persistGeneratedService({
 name: validation.data.name,
 description: validation.data.description,
 team: validation.data.team,
 ownerEmail: validation.data.ownerEmail,
 template: validation.data.template,
 environments: validation.data.environments,
 capabilities: validation.data.capabilities,
 visibility: validation.data.visibility,
 dockerHubNamespace: validation.data.dockerHubNamespace,
 estimatedMonthlyCost: validation.data.estimatedMonthlyCost,
 repository
 });
 steps.catalog = {
 status: "success",
 message: "Catalog record persisted.",
 details: {
 serviceId: service.id,
 repositoryName: service.repositoryName
 }
 };
 } catch (databaseError) {
 logDevelopmentStepError("catalog", databaseError);
 const databaseMessage = databaseError instanceof DatabaseConfigurationError ? databaseError.message : getErrorMessage(databaseError);
 steps.catalog = {
 status: "failed",
 message: `Catalog persistence failed: ${databaseMessage}`
 };
 }

 const warning = joinWarnings([
 steps.personalization.status !== "success" ? steps.personalization.message : undefined,
 steps.fleetDiscovery.status === "warning" ? steps.fleetDiscovery.message : undefined,
 steps.secrets.status === "warning" ? `${steps.secrets.message} Needs platform attention.` : undefined,
 steps.fleetRegistry.status === "warning" ? steps.fleetRegistry.message : undefined,
 steps.catalog.status !== "success" ? steps.catalog.message : undefined
 ]) || undefined;

 return NextResponse.json({
 mode: "github",
 service: validation.data,
 persistedService: service ? toCatalogApiService(service) : undefined,
 repository,
 templatePersonalization: personalization,
 ciSecrets,
 warning,
 steps,
 complete: isCriticalWorkflowSuccess(steps),
 needsAttention: hasWorkflowWarning(steps)
 });
 } catch (error) {
 if (error instanceof GitHubConfigurationError) {
 steps.repository = {
 status: "skipped",
 message: `${error.message} Returning demo repository information without calling GitHub.`
 };
 steps.secrets = {
 status: "skipped",
 message: "GitHub repository generation ran in demo mode, so CI secrets were not configured."
 };

 return NextResponse.json({
 mode: "mock",
 warning: steps.repository.message,
 service: validation.data,
 repository: buildMockRepository(validation.data.name),
 ciSecrets: {
 configured: false,
 configuredSecretNames: [],
 warning: steps.secrets.message
 },
 steps,
 complete: false,
 needsAttention: true
 });
 }

 if (error instanceof UnsupportedTemplateError) {
 return jsonError(error.message, 400);
 }

 logDevelopmentStepError("repository", error);
 const message = getErrorMessage(error);
 return jsonError(`GitHub API failure: ${message}`, 502);
 }
}
