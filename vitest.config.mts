import path from "node:path";
import { defineConfig } from "vitest/config";
const exclude = ["node_modules/**", ".next/**", "app/generated/**"];

function testDatabaseUrl() {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://xequemate:xequemate@localhost:5432/xequemate_test";
  const database = new URL(url).pathname.replace(/^\//, "");
  if (!database.endsWith("_test")) {
    throw new Error(
      `TEST_DATABASE_URL precisa apontar para um banco terminado em _test (recebido: ${database}). Os testes de integração apagam todas as tabelas.`,
    );
  }
  return url;
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(import.meta.dirname, "test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    silent: "passed-only",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: [...exclude, "**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["**/*.int.test.ts"],
          exclude,
          globalSetup: ["test/integration/global-setup.ts"],
          setupFiles: ["test/integration/setup.ts"],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
          env: {
            DATABASE_URL: testDatabaseUrl(),
            BETTER_AUTH_SECRET: "integration-tests-secret-0123456789abcdef",
            BETTER_AUTH_URL: "http://localhost:3000",
            NEXT_PUBLIC_AUTH_URL: "http://localhost:3000",
          },
        },
      },
    ],
  },
});
