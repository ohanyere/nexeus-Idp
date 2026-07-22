import assert from "node:assert/strict";
import test from "node:test";

import {
 REPOSITORY_INITIALIZATION_GUARD_TOKEN,
 REPOSITORY_INITIALIZATION_MARKER,
 canCompleteRepositoryInitialization,
 hasRepositoryInitializationGuard,
 shouldRunFullCi
} from "./github-bootstrap";

test("the template guard skips full CI during the generated repository's initial push", () => {
 assert.equal(shouldRunFullCi(new Set(["README.md", ".github/workflows/ci.yml"])), false);
});

test("the initialization marker commit enables the first full CI without a manual rerun", () => {
 assert.equal(shouldRunFullCi(new Set(["README.md", REPOSITORY_INITIALIZATION_MARKER])), true);
});

test("normal developer pushes continue to run CI after initialization", () => {
 const initializedRepository = new Set([REPOSITORY_INITIALIZATION_MARKER, "src/index.ts"]);
 assert.equal(shouldRunFullCi(initializedRepository), true);
 initializedRepository.add("src/new-feature.ts");
 assert.equal(shouldRunFullCi(initializedRepository), true);
});

test("initialization failures never create the marker that enables full CI", () => {
 for (const failedStep of ["personalization", "secrets", "fleetRegistry", "catalog"] as const) {
 const prerequisites = { personalization: true, secrets: true, fleetRegistry: true, catalog: true };
 prerequisites[failedStep] = false;
 assert.equal(canCompleteRepositoryInitialization(prerequisites), false);
 }
});

test("all initialization prerequisites permit the marker commit", () => {
 assert.equal(canCompleteRepositoryInitialization({ personalization: true, secrets: true, fleetRegistry: true, catalog: true }), true);
});

test("golden-path workflows must declare both bootstrap guard contract tokens", () => {
 const guardedWorkflow = `${REPOSITORY_INITIALIZATION_GUARD_TOKEN}: marker-present\n# ${REPOSITORY_INITIALIZATION_MARKER}`;
 assert.equal(hasRepositoryInitializationGuard(guardedWorkflow), true);
 assert.equal(hasRepositoryInitializationGuard(`run: test -f ${REPOSITORY_INITIALIZATION_MARKER}`), false);
});
