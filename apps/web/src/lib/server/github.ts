import "server-only";

import { Octokit } from "@octokit/rest";

import type { GoldenPathTemplate } from "@/lib/github-template";
import {
 findRecognizedPlaceholders,
 formatUnresolvedPlaceholders,
 hasRecognizedTemplatePlaceholder,
 isPersonalizableTemplateText,
 personalizeRepositoryContent,
 type UnresolvedTemplatePlaceholder
} from "@/lib/server/github-personalization";
import { encryptGitHubActionsSecret } from "@/lib/server/secret-encryption";

export type RepositoryInfo = {
 url: string;
 name: string;
 owner: string;
 defaultBranch: string;
};

export type GenerateRepositoryInput = {
 name: string;
 description?: string;
 template: GoldenPathTemplate;
 private: boolean;
};

export type RepositorySecretInput = {
 name: string;
 value: string;
};

export type RepositorySecretsResult = {
 configuredSecretNames: string[];
};

export type RepositoryTopicsResult = {
 topics: string[];
};

export type FleetRegistryEnvironment = "dev" | "stage" | "prod";

export type FleetRegistryFileResult = {
 environment: FleetRegistryEnvironment;
 path: string;
 status: "created" | "updated" | "unchanged";
};

export type FleetRegistryRegistrationResult = {
 owner: string;
 repo: string;
 branch: string;
 files: FleetRegistryFileResult[];
};

export type GenerateRepositoryResult = {
 repository: RepositoryInfo;
 alreadyExisted: boolean;
};

export type RepositoryReadinessResult = {
 defaultBranch: string;
 readyCommitSha: string;
 readyTreeSha: string;
 treeFileCount: number;
 attemptsUsed: number;
};

export type PersonalizeRepositoryTemplateInput = {
 repo: string;
 serviceName: string;
 teamName: string;
 ownerEmail: string;
 environment?: string;
 costCenter?: string;
 defaultBranch?: string;
 readiness: RepositoryReadinessResult;
};

export type PersonalizeRepositoryTemplateResult = {
 updatedFilePaths: string[];
 scannedFileCount: number;
 safeFileCount: number;
 personalizedFileCount: number;
 successfulUpdates?: number;
 failedUpdates?: number;
 failedFilePaths?: string[];
 retryStatistics?: GitHubFileUpdateRetryStatistics;
 remainingPlaceholderFilePaths: string[];
 unresolvedPlaceholders?: UnresolvedTemplatePlaceholder[];
 placeholdersReplaced: boolean;
 defaultBranch?: string;
 readyCommitSha?: string;
 readyTreeSha?: string;
 treeFileCount?: number;
 attemptsUsed?: number;
 warning?: string;
};

export type GitHubFileUpdateRetryStatistics = {
 attemptedUpdates: number;
 successfulUpdates: number;
 failedUpdates: number;
 retriedUpdates: number;
 retryAttempts: number;
 maxAttempts: number;
 backoffMs: number[];
 failedFilePaths: string[];
};

export type GitHubTemplatePersonalizationDiagnostics = Partial<RepositoryReadinessResult> & {
 retryStatistics?: GitHubFileUpdateRetryStatistics;
 unresolvedPlaceholders?: UnresolvedTemplatePlaceholder[];
};

type TemplateConfig = {
 owner: string;
 repo: string;
};

type SafeRepositoryFile = {
 path?: string;
 sha?: string;
};

type GitHubFileUpdateInput = {
 repo: string;
 path: string;
 content: string;
 sha: string;
 branch: string;
};

type GitHubFileUpdateRetryResult = {
 attemptsUsed: number;
 retried: boolean;
};

type RepositoryContentFile = {
 type: "file";
 content?: string;
 encoding?: string;
 sha?: string;
};

const templateEnvVars: Record<GoldenPathTemplate, string> = {
 "go-api": "GITHUB_TEMPLATE_REPO_GO_API",
 "node-api": "GITHUB_TEMPLATE_REPO_NODE_API",
 "python-api": "GITHUB_TEMPLATE_REPO_PYTHON_API",
 "nextjs-frontend": "GITHUB_TEMPLATE_REPO_NEXTJS_FRONTEND",
 "worker-service": "GITHUB_TEMPLATE_REPO_WORKER_SERVICE"
};

const fileUpdateMaxAttempts = 5;
const fileUpdateBackoffMs = [1000, 2000, 4000, 8000, 16000];
const fleetRegistryOwner = "ohanyere";
const fleetRegistryRepo = "platform-core";
const fleetRegistryBranch = "main";
const fleetRegistryEnvironments = ["dev", "stage", "prod"] as const satisfies readonly FleetRegistryEnvironment[];
const fleetRegistryCommitMessage = "feat: register generated services in fleet registry";

export class GitHubConfigurationError extends Error {
 constructor(message: string) {
 super(message);
 this.name = "GitHubConfigurationError";
 }
}

export class GitHubRepositoryExistsError extends Error {
 constructor(public readonly repositoryName: string) {
 super(`Repository ${repositoryName} already exists.`);
 this.name = "GitHubRepositoryExistsError";
 }
}

export class GitHubActionsSecretError extends Error {
 constructor(message: string) {
 super(message);
 this.name = "GitHubActionsSecretError";
 }
}

export class GitHubTemplatePersonalizationError extends Error {
 constructor(message: string, public readonly diagnostics?: GitHubTemplatePersonalizationDiagnostics) {
 super(message);
 this.name = "GitHubTemplatePersonalizationError";
 }
}

export class GitHubRepositoryNotReadyError extends Error {
 constructor(message: string, public readonly diagnostics?: Partial<RepositoryReadinessResult>) {
 super(message);
 this.name = "GitHubRepositoryNotReadyError";
 }
}

function requireEnv(name: string) {
 const value = process.env[name]?.trim();

 if (!value) {
 throw new GitHubConfigurationError(`Missing required environment variable: ${name}.`);
 }

 return value;
}

function getGitHubErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "Unknown GitHub API error.";
}

function getGitHubErrorStatus(error: unknown) {
 if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
 return error.status;
 }

 return undefined;
}

function getErrorCode(error: unknown): string | undefined {
 if (!error || typeof error !== "object") {
 return undefined;
 }

 if ("code" in error && typeof error.code === "string") {
 return error.code;
 }

 if ("cause" in error) {
 return getErrorCode(error.cause);
 }

 return undefined;
}

function isRetryableFileUpdateError(error: unknown) {
 const status = getGitHubErrorStatus(error);
 const code = getErrorCode(error);
 const message = getGitHubErrorMessage(error).toLowerCase();

 return status === 502
 || status === 503
 || status === 504
 || code === "ETIMEDOUT"
 || code === "ECONNRESET"
 || message.includes("connect timeout")
 || message.includes("timeout")
 || message.includes("api.github.com:443");
}

function formatReadinessDiagnostics(diagnostics: Partial<RepositoryReadinessResult>) {
 return `defaultBranch=${diagnostics.defaultBranch ?? "unknown"}, ` +
 `readyCommitSha=${diagnostics.readyCommitSha ?? "unknown"}, ` +
 `readyTreeSha=${diagnostics.readyTreeSha ?? "unknown"}, ` +
 `treeFileCount=${diagnostics.treeFileCount ?? "unknown"}, ` +
 `attemptsUsed=${diagnostics.attemptsUsed ?? "unknown"}`;
}

function isRetryableRepositoryReadinessError(error: unknown) {
 const status = getGitHubErrorStatus(error);
 const message = getGitHubErrorMessage(error).toLowerCase();

 return status === 404
 || status === 409
 || message.includes("git repository is empty")
 || message.includes("branch not found")
 || message.includes("tree not found")
 || message.includes("empty repository");
}

function logDevelopmentFileUpdateRetry(repo: string, path: string, attempt: number, retryInMs: number, error: unknown) {
 if (process.env.NODE_ENV !== "development") {
 return;
 }

 console.info("GitHub file update failed; retrying", {
 repository: repo,
 path,
 attempt,
 maxAttempts: fileUpdateMaxAttempts,
 retryInMs,
 error: getGitHubErrorMessage(error),
 status: getGitHubErrorStatus(error),
 code: getErrorCode(error)
 });
}

function logDevelopmentReadinessRetry(repo: string, attempt: number, error: unknown) {
 if (process.env.NODE_ENV !== "development") {
 return;
 }

 console.info("Generated repository is not ready yet", {
 repository: repo,
 attempt,
 maxAttempts: 15,
 retryInMs: 2000,
 error: getGitHubErrorMessage(error)
 });
}

function sleep(milliseconds: number) {
 return new Promise((resolve) => {
 setTimeout(resolve, milliseconds);
 });
}

function toSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-team";
}

function buildFleetRegistryContent(serviceName: string, environment: FleetRegistryEnvironment) {
 return [
 `service: ${serviceName}`,
 `repoURL: https://github.com/${fleetRegistryOwner}/${serviceName}.git`,
 "branch: main",
 `path: k8s/overlays/${environment}`,
 `namespace: ${serviceName}-${environment}`,
 ""
 ].join("\n");
}

function toRepositoryInfo(repository: {
 html_url?: string | null;
 name?: string | null;
 default_branch?: string | null;
 owner?: { login?: string | null } | null;
}): RepositoryInfo {
 return {
 url: repository.html_url ?? "",
 name: repository.name ?? "",
 owner: repository.owner?.login ?? "",
 defaultBranch: repository.default_branch ?? "main"
 };
}

export class GitHubService {
 private readonly octokit: Octokit;
 private readonly organization: string;
 private readonly templateOwner: string;

 constructor() {
 this.octokit = new Octokit({ auth: requireEnv("GITHUB_TOKEN") });
 this.organization = requireEnv("GITHUB_ORG");
 this.templateOwner = requireEnv("GITHUB_TEMPLATE_OWNER");
 }

 private getTemplateConfig(template: GoldenPathTemplate): TemplateConfig {
 const templateRepo = requireEnv(templateEnvVars[template]);

 return {
 owner: this.templateOwner,
 repo: templateRepo
 };
 }

 async repositoryExists(name: string) {
 try {
 await this.octokit.repos.get({
 owner: this.organization,
 repo: name
 });

 return true;
 } catch (error) {
 if (error && typeof error === "object" && "status" in error && error.status === 404) {
 return false;
 }

 throw error;
 }
 }

 async getRepository(name: string): Promise<RepositoryInfo> {
 const response = await this.octokit.repos.get({
 owner: this.organization,
 repo: name
 });

 return toRepositoryInfo(response.data);
 }

 async generateRepositoryFromTemplate(input: GenerateRepositoryInput): Promise<RepositoryInfo> {
 const template = this.getTemplateConfig(input.template);

 if (await this.repositoryExists(input.name)) {
 throw new GitHubRepositoryExistsError(input.name);
 }

 await this.verifySourceTemplateRepository(template);

 const response = await this.octokit.repos.createUsingTemplate({
 template_owner: template.owner,
 template_repo: template.repo,
 owner: this.organization,
 name: input.name,
 description: input.description,
 private: input.private
 });

 return toRepositoryInfo(response.data);
 }

 async generateOrGetRepositoryFromTemplate(input: GenerateRepositoryInput): Promise<GenerateRepositoryResult> {
 if (await this.repositoryExists(input.name)) {
 return {
 repository: await this.getRepository(input.name),
 alreadyExisted: true
 };
 }

 try {
 return {
 repository: await this.generateRepositoryFromTemplate(input),
 alreadyExisted: false
 };
 } catch (error) {
 if (error instanceof GitHubRepositoryExistsError) {
 return {
 repository: await this.getRepository(input.name),
 alreadyExisted: true
 };
 }

 throw error;
 }
 }

 async addRepositoryTopics(repo: string, topics: string[]): Promise<RepositoryTopicsResult> {
 const normalizedTopics = [...new Set(topics.map((topic) => toSlug(topic)).filter(Boolean))];

 const currentTopicsResponse = await this.octokit.repos.getAllTopics({
 owner: this.organization,
 repo
 });
 const mergedTopics = [...new Set([...currentTopicsResponse.data.names, ...normalizedTopics])].sort();

 await this.octokit.repos.replaceAllTopics({
 owner: this.organization,
 repo,
 names: mergedTopics
 });

 return {
 topics: mergedTopics
 };
 }

 async registerServiceInFleetRegistry(serviceName: string): Promise<FleetRegistryRegistrationResult> {
 const files: FleetRegistryFileResult[] = [];

 for (const environment of fleetRegistryEnvironments) {
 const path = `gitops/fleet/services/${environment}/${serviceName}.yaml`;
 const content = buildFleetRegistryContent(serviceName, environment);
 let sha: string | undefined;
 let status: FleetRegistryFileResult["status"] = "created";

 try {
 const existingContent = await this.octokit.repos.getContent({
 owner: fleetRegistryOwner,
 repo: fleetRegistryRepo,
 path,
 ref: fleetRegistryBranch
 });

 if (Array.isArray(existingContent.data) || existingContent.data.type !== "file") {
 throw new Error(`Expected ${path} in ${fleetRegistryOwner}/${fleetRegistryRepo} to be a file.`);
 }

 const fileContent = existingContent.data as RepositoryContentFile;
 sha = fileContent.sha;
 status = "updated";

 if (fileContent.content && fileContent.encoding === "base64") {
 const currentContent = Buffer.from(fileContent.content, "base64").toString("utf8");
 if (currentContent === content) {
 status = "unchanged";
 files.push({ environment, path, status });
 continue;
 }
 }
 } catch (error) {
 if (getGitHubErrorStatus(error) !== 404) {
 throw error;
 }
 }

 await this.octokit.repos.createOrUpdateFileContents({
 owner: fleetRegistryOwner,
 repo: fleetRegistryRepo,
 path,
 message: fleetRegistryCommitMessage,
 content: Buffer.from(content, "utf8").toString("base64"),
 sha,
 branch: fleetRegistryBranch
 });

 files.push({ environment, path, status });
 }

 return {
 owner: fleetRegistryOwner,
 repo: fleetRegistryRepo,
 branch: fleetRegistryBranch,
 files
 };
 }

 private async verifySourceTemplateRepository(template: TemplateConfig) {
 try {
 const readiness = await this.getRepositoryReadinessOnce(template.owner, template.repo);

 if (readiness.treeFileCount === 0) {
 throw new GitHubConfigurationError(`Source template repository ${template.owner}/${template.repo} is empty.`);
 }
 } catch (error) {
 if (error instanceof GitHubConfigurationError) {
 throw error;
 }

 if (isRetryableRepositoryReadinessError(error)) {
 throw new GitHubConfigurationError(`Source template repository ${template.owner}/${template.repo} is empty or has no readable default branch files.`);
 }

 throw error;
 }
 }

 private async getRepositoryReadinessOnce(owner: string, repo: string, attempt = 1): Promise<RepositoryReadinessResult> {
 const repositoryResponse = await this.octokit.repos.get({
 owner,
 repo
 });
 const defaultBranch = repositoryResponse.data.default_branch;

 if (!defaultBranch) {
 throw new GitHubRepositoryNotReadyError("Default branch not found.", { attemptsUsed: attempt });
 }

 const refResponse = await this.octokit.git.getRef({
 owner,
 repo,
 ref: `heads/${defaultBranch}`
 });
 const readyCommitSha = refResponse.data.object.sha;

 if (!readyCommitSha) {
 throw new GitHubRepositoryNotReadyError("Default branch commit SHA not found.", {
 defaultBranch,
 attemptsUsed: attempt
 });
 }

 const commitResponse = await this.octokit.git.getCommit({
 owner,
 repo,
 commit_sha: readyCommitSha
 });
 const readyTreeSha = commitResponse.data.tree.sha;

 if (!readyTreeSha) {
 throw new GitHubRepositoryNotReadyError("Default branch tree SHA not found.", {
 defaultBranch,
 readyCommitSha,
 attemptsUsed: attempt
 });
 }

 const treeResponse = await this.octokit.git.getTree({
 owner,
 repo,
 tree_sha: readyTreeSha,
 recursive: "true"
 });
 const treeFileCount = treeResponse.data.tree.filter((item) => item.type === "blob" && item.path).length;

 return {
 defaultBranch,
 readyCommitSha,
 readyTreeSha,
 treeFileCount,
 attemptsUsed: attempt
 };
 }

 async waitForRepositoryReady(repo: string): Promise<RepositoryReadinessResult> {
 const maxAttempts = 15;
 const retryDelayMs = 2000;
 let lastDiagnostics: Partial<RepositoryReadinessResult> | undefined;

 for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
 try {
 const readiness = await this.getRepositoryReadinessOnce(this.organization, repo, attempt);

 if (readiness.treeFileCount === 0) {
 lastDiagnostics = readiness;
 throw new GitHubRepositoryNotReadyError("Git Repository is empty.", readiness);
 }

 return readiness;
 } catch (error) {
 if (error instanceof GitHubRepositoryNotReadyError) {
 lastDiagnostics = error.diagnostics;
 }

 if (!isRetryableRepositoryReadinessError(error) || attempt === maxAttempts) {
 throw new GitHubRepositoryNotReadyError(
 `Repository ${this.organization}/${repo} was not ready for personalization after ${maxAttempts} attempts: ${getGitHubErrorMessage(error)}`,
 {
 ...lastDiagnostics,
 attemptsUsed: attempt
 }
 );
 }

 logDevelopmentReadinessRetry(`${this.organization}/${repo}`, attempt, error);
 await sleep(retryDelayMs);
 }
 }

 throw new GitHubRepositoryNotReadyError(`Repository ${this.organization}/${repo} was not ready for personalization.`, lastDiagnostics);
 }

 private async getRepositoryContents(repo: string, path: string, ref: string) {
 for (let attempt = 0; attempt < 3; attempt += 1) {
 try {
 const response = await this.octokit.repos.getContent({
 owner: this.organization,
 repo,
 path,
 ref
 });

 return response.data;
 } catch (error) {
 if (error && typeof error === "object" && "status" in error && error.status === 404 && attempt < 2) {
 await sleep(1000);
 continue;
 }

 throw error;
 }
 }

 throw new GitHubTemplatePersonalizationError(`Could not read repository contents for ${this.organization}/${repo}.`);
 }

 private async listTemplateFiles(
 repo: string,
 readiness: RepositoryReadinessResult
 ): Promise<{ scannedFileCount: number; readyTreeSha: string; treeFileCount: number; files: SafeRepositoryFile[] }> {
 const commitResponse = await this.octokit.git.getCommit({
 owner: this.organization,
 repo,
 commit_sha: readiness.readyCommitSha
 });
 const readyTreeSha = commitResponse.data.tree.sha;

 const response = await this.octokit.git.getTree({
 owner: this.organization,
 repo,
 tree_sha: readyTreeSha,
 recursive: "true"
 });
 const blobEntries = response.data.tree.filter((item) => item.type === "blob" && item.path);

 return {
 scannedFileCount: blobEntries.length,
 readyTreeSha,
 treeFileCount: blobEntries.length,
 files: blobEntries.map((item) => ({
 path: item.path,
 sha: item.sha
 }))
 };
 }

 private async updateRepositoryFileWithRetry(input: GitHubFileUpdateInput): Promise<GitHubFileUpdateRetryResult> {
 for (let attempt = 1; attempt <= fileUpdateMaxAttempts; attempt += 1) {
 try {
 await this.octokit.repos.createOrUpdateFileContents({
 owner: this.organization,
 repo: input.repo,
 path: input.path,
 message: "chore: personalize generated service template",
 content: input.content,
 sha: input.sha,
 branch: input.branch
 });

 return {
 attemptsUsed: attempt,
 retried: attempt > 1
 };
 } catch (error) {
 const retryInMs = fileUpdateBackoffMs[attempt - 1] ?? fileUpdateBackoffMs[fileUpdateBackoffMs.length - 1];

 if (!isRetryableFileUpdateError(error) || attempt === fileUpdateMaxAttempts) {
 throw error;
 }

 logDevelopmentFileUpdateRetry(`${this.organization}/${input.repo}`, input.path, attempt, retryInMs, error);
 await sleep(retryInMs);
 }
 }

 throw new GitHubTemplatePersonalizationError(`Could not update ${input.path} in ${this.organization}/${input.repo}.`);
 }

 private async findUnresolvedRepositoryPlaceholders(repo: string, branch: string) {
 const refResponse = await this.octokit.git.getRef({
 owner: this.organization,
 repo,
 ref: `heads/${branch}`
 });
 const commitResponse = await this.octokit.git.getCommit({
 owner: this.organization,
 repo,
 commit_sha: refResponse.data.object.sha
 });
 const treeResponse = await this.octokit.git.getTree({
 owner: this.organization,
 repo,
 tree_sha: commitResponse.data.tree.sha,
 recursive: "true"
 });

 if (treeResponse.data.truncated) {
 throw new GitHubTemplatePersonalizationError(
 `Could not validate placeholders in ${this.organization}/${repo}: GitHub returned a truncated repository tree.`
 );
 }

 const unresolved: UnresolvedTemplatePlaceholder[] = [];
 const files = treeResponse.data.tree.filter((item) => item.type === "blob" && item.path && item.sha);

 for (const file of files) {
 const blobResponse = await this.octokit.git.getBlob({
 owner: this.organization,
 repo,
 file_sha: file.sha!
 });
 const content = Buffer.from(blobResponse.data.content, "base64").toString("utf8");

 if (content.includes("\0")) {
 continue;
 }

 const placeholders = findRecognizedPlaceholders(content);
 if (placeholders.length > 0) {
 unresolved.push({ path: file.path!, placeholders });
 }
 }

 return unresolved;
 }

 async personalizeRepositoryTemplate(input: PersonalizeRepositoryTemplateInput): Promise<PersonalizeRepositoryTemplateResult> {
 const ref = input.readiness.readyCommitSha;
 const branch = input.readiness.defaultBranch;
 let scannedFileCount = 0;
 let files: SafeRepositoryFile[];
 let diagnostics: RepositoryReadinessResult = input.readiness;

 try {
 const listing = await this.listTemplateFiles(input.repo, input.readiness);
 scannedFileCount = listing.scannedFileCount;
 files = listing.files;
 diagnostics = {
 ...input.readiness,
 readyTreeSha: listing.readyTreeSha,
 treeFileCount: listing.treeFileCount
 };

 if (listing.treeFileCount === 0) {
 throw new GitHubTemplatePersonalizationError(
 `GitHub reported an empty repository while listing template files in ${this.organization}/${input.repo}. ` +
 `Readiness diagnostics: ${formatReadinessDiagnostics(diagnostics)}.`,
 diagnostics
 );
 }
 } catch (error) {
 if (error instanceof GitHubTemplatePersonalizationError) {
 throw error;
 }

 throw new GitHubTemplatePersonalizationError(
 `Could not list template files in ${this.organization}/${input.repo}: ${getGitHubErrorMessage(error)} ` +
 `Readiness diagnostics: ${formatReadinessDiagnostics(diagnostics)}.`,
 diagnostics
 );
 }

 const updatedFilePaths: string[] = [];
 const failedFilePaths: string[] = [];
 const remainingPlaceholderFilePaths: string[] = [];
 let attemptedUpdates = 0;
 let successfulUpdates = 0;
 let failedUpdates = 0;
 let retriedUpdates = 0;
 let retryAttempts = 0;

 for (const file of files) {
 if (!file.path) {
 continue;
 }

 let fileContents;
 try {
 fileContents = await this.getRepositoryContents(input.repo, file.path, ref);
 } catch (error) {
 throw new GitHubTemplatePersonalizationError(
 `Could not read ${file.path} in ${this.organization}/${input.repo}: ${getGitHubErrorMessage(error)} ` +
 `Readiness diagnostics: ${formatReadinessDiagnostics(diagnostics)}.`,
 diagnostics
 );
 }

 if (Array.isArray(fileContents) || fileContents.type !== "file" || !fileContents.content || fileContents.encoding !== "base64") {
 continue;
 }

 const originalContent = Buffer.from(fileContents.content, "base64").toString("utf8");

 if (!isPersonalizableTemplateText(originalContent)) {
 continue;
 }

 const personalizedContent = personalizeRepositoryContent(originalContent, input);

 if (hasRecognizedTemplatePlaceholder(personalizedContent)) {
 remainingPlaceholderFilePaths.push(file.path);
 }

 if (personalizedContent === originalContent) {
 continue;
 }

 attemptedUpdates += 1;

 try {
 const updateResult = await this.updateRepositoryFileWithRetry({
 path: file.path,
 repo: input.repo,
 content: Buffer.from(personalizedContent, "utf8").toString("base64"),
 sha: fileContents.sha,
 branch
 });
 successfulUpdates += 1;
 retryAttempts += updateResult.attemptsUsed - 1;
 if (updateResult.retried) {
 retriedUpdates += 1;
 }
 updatedFilePaths.push(file.path);
 } catch (error) {
 failedUpdates += 1;
 failedFilePaths.push(file.path);
 console.warn("GitHub file update failed during repository personalization", {
 repository: `${this.organization}/${input.repo}`,
 path: file.path,
 error: getGitHubErrorMessage(error),
 status: getGitHubErrorStatus(error),
 code: getErrorCode(error)
 });
 continue;
 }
 }

 const retryStatistics: GitHubFileUpdateRetryStatistics = {
 attemptedUpdates,
 successfulUpdates,
 failedUpdates,
 retriedUpdates,
 retryAttempts,
 maxAttempts: fileUpdateMaxAttempts,
 backoffMs: fileUpdateBackoffMs,
 failedFilePaths
 };

 if (failedUpdates > 0 && successfulUpdates === 0) {
 throw new GitHubTemplatePersonalizationError(
 `Could not update any personalized files in ${this.organization}/${input.repo}. ` +
 `Failed files: ${failedFilePaths.join(", ")}. ` +
 `Retry statistics: attemptedUpdates=${attemptedUpdates}, failedUpdates=${failedUpdates}, retryAttempts=${retryAttempts}, ` +
 `maxAttempts=${fileUpdateMaxAttempts}. ` +
 `Readiness diagnostics: ${formatReadinessDiagnostics(diagnostics)}.`,
 {
 ...diagnostics,
 retryStatistics
 }
 );
 }

 const unresolvedPlaceholders = await this.findUnresolvedRepositoryPlaceholders(input.repo, branch);
 remainingPlaceholderFilePaths.splice(
 0,
 remainingPlaceholderFilePaths.length,
 ...unresolvedPlaceholders.map(({ path }) => path)
 );

 if (unresolvedPlaceholders.length > 0) {
 throw new GitHubTemplatePersonalizationError(
 `Repository setup stopped because unresolved template placeholders remain in ${this.organization}/${input.repo}: ` +
 `${formatUnresolvedPlaceholders(unresolvedPlaceholders)}.`,
 {
 ...diagnostics,
 retryStatistics,
 unresolvedPlaceholders
 }
 );
 }

 const warnings = [
 remainingPlaceholderFilePaths.length > 0
 ? `Template personalization left placeholders in ${remainingPlaceholderFilePaths.length} file(s): ${remainingPlaceholderFilePaths.join(", ")}.`
 : undefined,
 failedUpdates > 0
 ? `Template personalization updated ${successfulUpdates} file(s), but ${failedUpdates} file update(s) failed after retries: ${failedFilePaths.join(", ")}.`
 : undefined
 ];
 const warning = warnings.filter(Boolean).join(" ") || undefined;

 console.info("Generated repository personalization completed", {
 repository: `${this.organization}/${input.repo}`,
 scannedFileCount,
 safeFileCount: files.length,
 personalizedFileCount: updatedFilePaths.length,
 successfulUpdates,
 failedUpdates,
 failedFilePaths,
 retryStatistics,
 remainingPlaceholderFileCount: remainingPlaceholderFilePaths.length,
 includesWorkflowYaml: files.some((file) => Boolean(file.path?.match(/^\.github\/workflows\/.*\.ya?ml$/)))
 });

 return {
 updatedFilePaths,
 scannedFileCount,
 safeFileCount: files.length,
 personalizedFileCount: updatedFilePaths.length,
 successfulUpdates,
 failedUpdates,
 failedFilePaths,
 retryStatistics,
 remainingPlaceholderFilePaths,
 unresolvedPlaceholders,
 placeholdersReplaced: remainingPlaceholderFilePaths.length === 0,
 defaultBranch: input.readiness.defaultBranch,
 readyCommitSha: input.readiness.readyCommitSha,
 readyTreeSha: diagnostics.readyTreeSha,
 treeFileCount: diagnostics.treeFileCount,
 attemptsUsed: input.readiness.attemptsUsed,
 warning
 };
 }

 async createOrUpdateRepositoryActionsSecrets(repo: string, secrets: RepositorySecretInput[]): Promise<RepositorySecretsResult> {
 if (secrets.length === 0) {
 return { configuredSecretNames: [] };
 }

 let publicKeyResponse;
 try {
 publicKeyResponse = await this.octokit.request("GET /repos/{owner}/{repo}/actions/secrets/public-key", {
 owner: this.organization,
 repo
 });
 } catch (error) {
 throw new GitHubActionsSecretError(`Could not read GitHub Actions public key for ${this.organization}/${repo}: ${getGitHubErrorMessage(error)}`);
 }

 const key = publicKeyResponse.data.key;
 const keyId = publicKeyResponse.data.key_id;

 if (!key || !keyId) {
 throw new GitHubActionsSecretError(`GitHub Actions public key response for ${this.organization}/${repo} was missing key data.`);
 }

 const configuredSecretNames: string[] = [];

 for (const secret of secrets) {
 const encryptedValue = await encryptGitHubActionsSecret(secret.value, key);

 try {
 await this.octokit.request("PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}", {
 owner: this.organization,
 repo,
 secret_name: secret.name,
 encrypted_value: encryptedValue,
 key_id: keyId
 });
 configuredSecretNames.push(secret.name);
 } catch (error) {
 throw new GitHubActionsSecretError(`Could not configure GitHub Actions secret ${secret.name} for ${this.organization}/${repo}: ${getGitHubErrorMessage(error)}`);
 }
 }

 return { configuredSecretNames };
 }

 async configureDockerHubActionsSecrets(repo: string): Promise<RepositorySecretsResult> {
 return this.createOrUpdateRepositoryActionsSecrets(repo, [
 { name: "DOCKERHUB_USERNAME", value: requireEnv("DOCKERHUB_USERNAME") },
 { name: "DOCKERHUB_TOKEN", value: requireEnv("DOCKERHUB_TOKEN") }
 ]);
 }
}

export function createGitHubService() {
 return new GitHubService();
}
