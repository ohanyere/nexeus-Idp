import { NextResponse } from "next/server";

import { listPersistedServices, toCatalogApiService } from "@/lib/server/catalog";
import { DatabaseConfigurationError } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
 try {
 const services = await listPersistedServices();

 return NextResponse.json({
 source: "database",
 services: services.map(toCatalogApiService)
 }, {
 headers: {
 "Cache-Control": "no-store"
 }
 });
 } catch (error) {
 if (error instanceof DatabaseConfigurationError) {
 return NextResponse.json(
 {
 error: error.message,
 services: []
 },
 { status: 503 }
 );
 }

 const message = error instanceof Error ? error.message : "Unable to load persisted services.";
 return NextResponse.json(
 {
 error: message,
 services: []
 },
 { status: 500 }
 );
 }
}
