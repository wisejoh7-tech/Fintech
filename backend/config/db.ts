import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return;

  try {
    const url = new URL(rawUrl);
    if (url.protocol === "mysql:" && !url.searchParams.has("sslaccept")) {
      url.searchParams.set("sslaccept", "strict");
      process.env.DATABASE_URL = url.toString();
    }
  } catch {
    // Prisma reports malformed connection strings with its normal validation error.
  }
}

normalizeDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
