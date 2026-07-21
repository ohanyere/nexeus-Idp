import { PLATFORM_DOCKER_HUB_NAMESPACE } from "../platform";

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

const placeholderTokens = recognizedTemplatePlaceholderNames.map((name) => `__${name}__`);

export function toServiceSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-service";
}

function toTeamSlug(value: string) {
 return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-team";
}

export function findRecognizedPlaceholders(content: string): RecognizedTemplatePlaceholderName[] {
 return recognizedTemplatePlaceholderNames.filter((name) => content.includes(`__${name}__`));
}

export function hasRecognizedTemplatePlaceholder(content: string) {
 return placeholderTokens.some((placeholder) => content.includes(placeholder));
}

export function isPersonalizableTemplateText(content: string) {
 return !content.includes("\0") && hasRecognizedTemplatePlaceholder(content);
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
 personalized = personalized.replaceAll(`__${placeholder}__`, value);
 }

 return personalized;
}

export function formatUnresolvedPlaceholders(files: UnresolvedTemplatePlaceholder[]) {
 return files.map(({ path, placeholders }) => `${path} (${placeholders.join(", ")})`).join("; ");
}
