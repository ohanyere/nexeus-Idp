import { PLATFORM_DOCKER_HUB_NAMESPACE } from "../platform.ts";

export const recognizedTemplatePlaceholderNames = [
 "SERVICE_NAME",
 "SERVICE_SLUG",
 "DOCKER_IMAGE",
 "TEAM_NAME",
 "OWNER_EMAIL",
 "ENVIRONMENT",
 "COST_CENTER"
] as const;

export type RecognizedTemplatePlaceholderName = typeof recognizedTemplatePlaceholderNames[number];

export type TemplatePersonalizationValues = {
 serviceName: string;
 teamName: string;
 ownerEmail: string;
 environment?: string;
 costCenter?: string;
};

export type UnresolvedTemplatePlaceholder = {
 path: string;
 placeholders: RecognizedTemplatePlaceholderName[];
};

const placeholderTokens = recognizedTemplatePlaceholderNames.flatMap((name) => [
 `__${name}__`,
 `**${name}**`
]);

export function toServiceSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-service";
}

function toTeamSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-team";
}

export function isSafeTemplateTextFile(path: string) {
 const fileName = path.split("/").pop() ?? path;

 if (fileName === "Dockerfile" || fileName === "Makefile" || fileName === "package.json" || fileName === "tsconfig.json") {
 return true;
 }

 if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(path)) {
 return true;
 }

 if (/^(k8s|platform|monitoring)\/.+\.ya?ml$/.test(path)) {
 return true;
 }

 return /^docs\/.+\.md$/.test(path);
}

export function findRecognizedPlaceholders(content: string): RecognizedTemplatePlaceholderName[] {
 return recognizedTemplatePlaceholderNames.filter((name) => (
 content.includes(`__${name}__`) || content.includes(`**${name}**`)
 ));
}

export function hasRecognizedTemplatePlaceholder(content: string) {
 return placeholderTokens.some((placeholder) => content.includes(placeholder));
}

export function personalizeRepositoryContent(content: string, input: TemplatePersonalizationValues) {
 const serviceSlug = toServiceSlug(input.serviceName);
 const environment = input.environment?.trim() || "dev";
 const costCenter = input.costCenter?.trim() || toTeamSlug(input.teamName);
 const replacements: Record<RecognizedTemplatePlaceholderName, string> = {
 SERVICE_NAME: input.serviceName,
 SERVICE_SLUG: serviceSlug,
 DOCKER_IMAGE: `${PLATFORM_DOCKER_HUB_NAMESPACE}/${serviceSlug}`,
 TEAM_NAME: input.teamName,
 OWNER_EMAIL: input.ownerEmail,
 ENVIRONMENT: environment,
 COST_CENTER: costCenter
 };

 let personalized = content;

 for (const [placeholder, value] of Object.entries(replacements)) {
 personalized = personalized
 .replaceAll(`__${placeholder}__`, value)
 .replaceAll(`**${placeholder}**`, value);
 }

 return personalized;
}

export function formatUnresolvedPlaceholders(files: UnresolvedTemplatePlaceholder[]) {
 return files.map(({ path, placeholders }) => `${path} (${placeholders.join(", ")})`).join("; ");
}
