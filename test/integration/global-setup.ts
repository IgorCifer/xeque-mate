import { execSync } from "node:child_process";
import type { TestProject } from "vitest/node";

export default function setup(project: TestProject) {
  const databaseUrl = project.config.env.DATABASE_URL;
  if (typeof databaseUrl !== "string" || !databaseUrl.includes("_test")) {
    throw new Error("DATABASE_URL de teste não configurada no vitest.config.mts");
  }
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
}
