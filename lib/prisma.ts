import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../app/generated/prisma2/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "production" ? [] : ["query", "error", "warn"],
  });
}

const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;

export type Db = Prisma.TransactionClient;

export function withTransaction<T>(tx: Db | undefined, fn: (db: Db) => Promise<T>): Promise<T> {
  return tx ? fn(tx) : prisma.$transaction(fn);
}
