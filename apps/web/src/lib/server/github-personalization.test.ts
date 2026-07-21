import assert from "node:assert/strict";
import test from "node:test";

import {
 findRecognizedPlaceholders,
 isSafeTemplateTextFile,
 personalizeRepositoryContent,
 toServiceSlug
} from "./github-personalization.ts";

const input = {
 serviceName: "continue-api",
 teamName: "Platform Team",
 ownerEmail: "owner@example.com"
};

test("includes workflow files in the hidden .github directory", () => {
 assert.equal(isSafeTemplateTextFile(".github/workflows/ci.yml"), true);
 assert.equal(isSafeTemplateTextFile(".github/workflows/release.yaml"), true);
 assert.equal(isSafeTemplateTextFile("github/workflows/ci.yml"), false);
});

test("replaces service workflow placeholders with the normalized service slug", () => {
 const workflow = [
 "env:",
 "  IMAGE: docker.io/${{ secrets.DOCKERHUB_USERNAME }}/__SERVICE_SLUG__:${{ github.sha }}",
 "  LEGACY_IMAGE: docker.io/${{ secrets.DOCKERHUB_USERNAME }}/**SERVICE_NAME**:${{ github.sha }}",
 "  CANONICAL_IMAGE: __DOCKER_IMAGE__:${{ github.sha }}"
 ].join("\n");

 const personalized = personalizeRepositoryContent(workflow, input);

 assert.match(personalized, /docker\.io\/\$\{\{ secrets\.DOCKERHUB_USERNAME \}\}\/continue-api:\$\{\{ github\.sha \}\}/);
 assert.match(personalized, /kuberpull\/continue-api:\$\{\{ github\.sha \}\}/);
 assert.deepEqual(findRecognizedPlaceholders(personalized), []);
});

test("normalizes Docker-compatible service image names", () => {
 assert.equal(toServiceSlug(" Continue API "), "continue-api");
 assert.equal(toServiceSlug("Payments_API.v2"), "payments-api-v2");
});

test("reports unresolved recognized placeholders by name", () => {
 assert.deepEqual(
 findRecognizedPlaceholders("image: __DOCKER_IMAGE__\nname: **SERVICE_SLUG**\nkeep: $SERVICE_NAME"),
 ["SERVICE_SLUG", "DOCKER_IMAGE"]
 );
});
