import { NextResponse } from "next/server";

import {
 PromotionServiceError,
 createPromotionService,
 type RollbackTargetEnvironment
} from "@/lib/server/promotion-service";

type RollbackApiRequest = {
 service?: unknown;
 owner?: unknown;
 repo?: unknown;
 targetEnvironment?: unknown;
 actor?: unknown;
};

const rollbackTargets = new Set(["stage", "prod"]);

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

function validateBody(body: RollbackApiRequest) {
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

 if (!rollbackTargets.has(targetEnvironment)) {
  errors.push("Target environment must be stage or prod.");
 }

 return {
  data: {
   service,
   owner,
   repo,
   targetEnvironment: targetEnvironment as RollbackTargetEnvironment,
   actor
  },
  errors
 };
}

export async function POST(request: Request) {
 let body: RollbackApiRequest;

 try {
  body = await request.json();
 } catch {
  return jsonError("Request body must be valid JSON.", 400);
 }

 const validation = validateBody(body);

 if (validation.errors.length > 0) {
  return jsonError("Invalid rollback request.", 400, validation.errors);
 }

 try {
  const promotionService = createPromotionService();
  const result = await promotionService.rollback(validation.data);

  return NextResponse.json({
   mode: "github",
   rollback: result,
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

  const message = error instanceof Error ? error.message : "Unknown rollback failure.";

  return NextResponse.json(
   {
    mode: "warning",
    warning: message
   },
   { status: 200 }
  );
 }
}
