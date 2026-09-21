import { defineConfig } from "drizzle-kit";

// `generate` only reads the schema and needs no database. The migration runs through
// scripts/db-migrate.mjs, so no connection string is configured here.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
