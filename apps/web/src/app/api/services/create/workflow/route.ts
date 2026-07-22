import { NextResponse } from "next/server";

import { GitHubConfigurationError, createGitHubService } from "@/lib/server/github";

const repositoryNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request: Request) {
 const url = new URL(request.url);
 const repo = url.searchParams.get("repo")?.trim() ?? "";
 const runId = Number(url.searchParams.get("runId"));

 if (!repositoryNamePattern.test(repo) || !Number.isSafeInteger(runId) || runId <= 0) {
 return NextResponse.json({ error: "A valid repository and workflow run ID are required." }, { status: 400 });
 }

 try {
 const run = await createGitHubService().getWorkflowRun(repo, runId);
 return NextResponse.json({
 workflowRunUrl: run.url,
 workflowRunId: run.id,
 workflowStatus: run.status,
 finalWorkflowStatus: run.conclusion ?? run.status,
 complete: run.status === "completed"
 });
 } catch (error) {
 const message = error instanceof Error ? error.message : "Could not read the GitHub workflow run.";
 return NextResponse.json(
 { error: message },
 { status: error instanceof GitHubConfigurationError ? 503 : 502 }
 );
 }
}
