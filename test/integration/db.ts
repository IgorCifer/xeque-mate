import prisma from "@/lib/prisma";

const KEEP = new Set(["_prisma_migrations", "Achievement"]);

export async function resetDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const names = tables
    .map((t) => t.tablename)
    .filter((name) => !KEEP.has(name))
    .map((name) => `"public"."${name}"`);
  if (names.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${names.join(", ")} RESTART IDENTITY CASCADE`);
  }
}
