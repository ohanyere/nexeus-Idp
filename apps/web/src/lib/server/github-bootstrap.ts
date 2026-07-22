export const REPOSITORY_INITIALIZATION_MARKER = ".idp/repository-initialized";
export const REPOSITORY_INITIALIZATION_GUARD_TOKEN = "IDP_REPOSITORY_INITIALIZED";

export type InitializationPrerequisites = {
 personalization: boolean;
 secrets: boolean;
 fleetRegistry: boolean;
 catalog: boolean;
};

export function canCompleteRepositoryInitialization(prerequisites: InitializationPrerequisites) {
 return Object.values(prerequisites).every(Boolean);
}

export function hasRepositoryInitializationGuard(workflow: string) {
 return workflow.includes(REPOSITORY_INITIALIZATION_MARKER)
 && workflow.includes(REPOSITORY_INITIALIZATION_GUARD_TOKEN);
}

export function buildRepositoryInitializationMarker() {
 return [
 "# Managed by the Internal Developer Platform.",
 "# This commit is created only after repository personalization, CI secrets, fleet registration, and catalog persistence succeed.",
 "initialized: true",
 ""
 ].join("\n");
}

export function shouldRunFullCi(repositoryFiles: ReadonlySet<string>) {
 return repositoryFiles.has(REPOSITORY_INITIALIZATION_MARKER);
}
