import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    __internal: {
      engine: {
        connectionLimit: 3, // ضروري لمنع انهيار السيرفر
      },
    } as any,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}