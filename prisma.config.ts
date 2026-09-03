// prisma.config.ts
// Prisma CLI config (schema/migration paths + how to run the seed script).
// Requires: npm install --save-dev prisma dotenv tsx
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
