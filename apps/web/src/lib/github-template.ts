export type GoldenPathTemplate =
 | "go-api"
 | "node-api"
 | "python-api"
 | "nextjs-frontend"
 | "worker-service";

export class UnsupportedTemplateError extends Error {
 constructor(public readonly template: string) {
 super(`Unsupported template: ${template}.`);
 this.name = "UnsupportedTemplateError";
 }
}

export function normalizeTemplate(value: string): GoldenPathTemplate {
 const normalized = value.trim().toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
 const aliases: Record<string, GoldenPathTemplate> = {
 "go-api": "go-api",
 "node-api": "node-api",
 "nodejs-api": "node-api",
 "python-api": "python-api",
 "nextjs-frontend": "nextjs-frontend",
 "next-frontend": "nextjs-frontend",
 "next-js-frontend": "nextjs-frontend",
 "worker-service": "worker-service"
 };
 const template = aliases[normalized];

 if (!template) {
 throw new UnsupportedTemplateError(value);
 }

 return template;
}
