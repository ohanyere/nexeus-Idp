import { NextResponse } from "next/server";

import {
 PromotionServiceError,
 createPromotionService,
 type PromotionTargetEnvironment
} from "@/lib/server/promotion-service";

type PromotionApiRequest = {
 service?: unknown;
 owner?: unknown;
 repo?: unknown;
 targetEnvironment?: unknown;
 actor?: unknown;
};

const promotionTargets = new Set(["stage", "prod"]);

function stringValue(value: unknown) {
 return typeof value === "string" ? value.trim() : "";
}

function jsonError(message: string, status: number, details?: string[]) {
 return NextResponse.json(
  {
   error: message,
   details
  },
  { status }
 );
}

function validateBody(body: PromotionApiRequest) {
 const service = stringValue(body.service);
 const owner = stringValue(body.owner);
 const repo = stringValue(body.repo);
 const targetEnvironment = stringValue(body.targetEnvironment);
 const actor = stringValue(body.actor) || "IDP user";
 const errors: string[] = [];

 if (!service) {
  errors.push("Service is required.");
 }

 if (!owner) {
  errors.push("GitHub owner is required.");
 }

 if (!repo) {
  errors.push("GitHub repository is required.");
 }

 if (!promotionTargets.has(targetEnvironment)) {
  errors.push("Target environment must be stage or prod.");
 }

 return {
  data: {
   service,
   owner,
   repo,
   targetEnvironment: targetEnvironment as PromotionTargetEnvironment,
   actor
  },
  errors
 };
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const service = url.searchParams.get("service")?.trim() || "";
 const owner = url.searchParams.get("owner")?.trim() || "";
 const repo = url.searchParams.get("repo")?.trim() || "";

 if (!service || !owner || !repo) {
  return jsonError("service, owner, and repo query parameters are required.", 400);
 }

 try {
  const promotionService = createPromotionService();
  const snapshot = await promotionService.getReleaseSnapshot({ service, owner, repo });

  return NextResponse.json({
   mode: "github",
   snapshot
  });
 } catch (error) {
  const message = error instanceof Error ? error.message : "Unknown promotion snapshot failure.";

  return NextResponse.json(
   {
    mode: "warning",
    warning: message,
    snapshot: undefined
   },
   { status: 200 }
  );
 }
}

export async function POST(request: Request) {
 let body: PromotionApiRequest;

 try {
  body = await request.json();
 } catch {
  return jsonError("Request body must be valid JSON.", 400);
 }

 const validation = validateBody(body);

 if (validation.errors.length > 0) {
  return jsonError("Invalid promotion request.", 400, validation.errors);
 }

 try {
  const promotionService = createPromotionService();
  const result = await promotionService.promote(validation.data);

  return NextResponse.json({
   mode: "github",
   promotion: result,
   warning: result.warning
  });
 } catch (error) {
  if (error instanceof PromotionServiceError) {
   return NextResponse.json(
    {
     mode: "warning",
     warning: error.message,
     auditEvent: error.auditEvent
    },
    { status: 200 }
   );
  }

  const message = error instanceof Error ? error.message : "Unknown promotion failure.";

  return NextResponse.json(
   {
    mode: "warning",
    warning: message
   },
   { status: 200 }
  );
 }
}
