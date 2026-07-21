import assert from "node:assert/strict";
import test from "node:test";

import {
 findRecognizedPlaceholders,
 isPersonalizableTemplateText,
 personalizeRepositoryContent,
 toServiceSlug
} from "./github-personalization";

const input = {
 serviceName: "continue-api",
 teamName: "Platform Team",
 ownerEmail: "owner@example.com"
};

test("personalizes recognized placeholders in every text-file context", () => {
 for (const content of [
 "SERVICE_NAME=__SERVICE_NAME__",
 "# __SERVICE_NAME__",
 "{\"service\": \"__SERVICE_NAME__\"}",
 "export const serviceName = \"__SERVICE_NAME__\";",
 "image: __DOCKER_IMAGE__"
 ]) {
 assert.equal(isPersonalizableTemplateText(content), true);
 }

 assert.equal(isPersonalizableTemplateText("SERVICE_NAME=runtime-value"), false);
 assert.equal(isPersonalizableTemplateText("__SERVICE_NAME__\0binary"), false);
});

test("regenerates .github/workflows/ci.yaml without unresolved service placeholders", () => {
 const workflow = [
 "jobs:",
 "  build:",
 "    uses: org/workflows/.github/workflows/build.yaml@main",
 "    with:",
 "      service_name: **SERVICE_NAME**",
 "      image_ref: kuberpull/**SERVICE_NAME**:${{ github.sha }}",
 "  update-manifest:",
 "    runs-on: ubuntu-latest",
 "    steps:",
 "      - name: Update image",
 "        run: |",
 "          perl -0pi -e 's#name: kuberpull/[^\\s]+#name: kuberpull/**SERVICE_NAME**#' deployment.yaml",
 "          echo 'image=kuberpull/**SERVICE_NAME**:${{ github.sha }}'"
 ].join("\n");

 const personalized = personalizeRepositoryContent(workflow, {
 ...input,
 serviceName: "Review API"
 });

 assert.match(personalized, /service_name: review-api/);
 assert.match(personalized, /image_ref: kuberpull\/review-api:\$\{\{ github\.sha \}\}/);
 assert.match(personalized, /perl .*name: kuberpull\/review-api/);
 assert.match(personalized, /echo 'image=kuberpull\/review-api:\$\{\{ github\.sha \}\}'/);
 assert.deepEqual(findRecognizedPlaceholders(personalized), []);
 assert.doesNotMatch(personalized, /\*\*SERVICE_NAME\*\*/);
});

test("normalizes Docker-compatible service image names", () => {
 assert.equal(toServiceSlug(" Continue API "), "continue-api");
 assert.equal(toServiceSlug("Payments_API.v2"), "payments-api-v2");
});

test("replaces the complete canonical contract across reported template files", () => {
 const reportedFiles = new Map([
 [".env.example", "SERVICE_NAME=__SERVICE_NAME__\nENVIRONMENT=__ENVIRONMENT__"],
 [".github/workflows/ci.yaml", "image: __DOCKER_IMAGE__:${{ github.sha }}\nslug: __SERVICE_SLUG__"],
 ["README.md", "Owned by __TEAM_NAME__ (__OWNER_EMAIL__)"],
 ["monitoring/dashboard.json", "{\"service\":\"__SERVICE_NAME__\"}"],
 ["src/config/env.ts", "export const environment = \"__ENVIRONMENT__\";"],
 ["src/server.ts", "const costCenter = \"__COST_CENTER__\";"]
 ]);
 const completeInput = { ...input, environment: "stage", costCenter: "cc-42" };

 const personalizedFiles = [...reportedFiles.entries()].map(([path, content]) => ({
 path,
 content: personalizeRepositoryContent(content, completeInput)
 }));

 assert.deepEqual(
 personalizedFiles.flatMap(({ path, content }) => findRecognizedPlaceholders(content).map((placeholder) => ({ path, placeholder }))),
 []
 );
 assert.match(personalizedFiles.find(({ path }) => path === ".env.example")!.content, /SERVICE_NAME=continue-api/);
 assert.match(personalizedFiles.find(({ path }) => path === "README.md")!.content, /Platform Team \(owner@example\.com\)/);
 assert.match(personalizedFiles.find(({ path }) => path === "src/server.ts")!.content, /cc-42/);
});

test("reports canonical and supported legacy generation-time placeholders by name", () => {
 assert.deepEqual(
 findRecognizedPlaceholders("image: __DOCKER_IMAGE__\nname: __SERVICE_SLUG__\nkeep: $SERVICE_NAME\nlegacy: **SERVICE_NAME**"),
 ["SERVICE_NAME", "SERVICE_SLUG", "DOCKER_IMAGE"]
 );
});
