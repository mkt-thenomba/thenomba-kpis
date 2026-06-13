// Cliente Prisma único (patrón singleton para evitar múltiples conexiones
// en desarrollo con hot-reload). Único punto de acceso a la base de datos.
//
// Toda la app importa `prisma` desde aquí. Para migrar a Postgres basta con
// cambiar el `provider`/`url` en schema.prisma y .env: estas queries no usan
// nada exclusivo de SQLite.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
