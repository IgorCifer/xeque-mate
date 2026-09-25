import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `tsx prisma/seed.ts`,
  },
  engine: "classic",
  datasource: {
    // For Prisma 7, connection URLs are configured here instead of schema.prisma
    url: env("DATABASE_URL"),
  },
});
