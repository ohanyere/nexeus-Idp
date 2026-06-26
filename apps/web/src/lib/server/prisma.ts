import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
 prisma?: PrismaClient;
};

export function isDatabaseConfigured() {
 return Boolean(process.env.DATABASE_URL?.trim());
}

export class DatabaseConfigurationError extends Error {
 constructor() {
 super("DATABASE_URL is not configured.");
 this.name = "DatabaseConfigurationError";
 }
}

export const prisma =
 globalForPrisma.prisma ??
 new PrismaClient({
 log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
 });

if (process.env.NODE_ENV !== "production") {
 globalForPrisma.prisma = prisma;
}

export function requireDatabase() {
 if (!isDatabaseConfigured()) {
 throw new DatabaseConfigurationError();
 }

 return prisma;
}
