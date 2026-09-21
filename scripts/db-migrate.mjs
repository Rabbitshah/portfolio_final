// Applies the SQL files in ./drizzle to the database in DATABASE_URL.
// Uses the same Neon HTTP driver as the app. Never prints the connection string.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is not set. Put it in .env.local (see .env.example).",
  );
  process.exit(1);
}

try {
  const db = drizzle({ client: neon(url) });
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
} catch (error) {
  // Class name only: driver errors can echo connection details.
  console.error(
    `Migration failed (${error instanceof Error ? error.name : "unknown error"}).`,
  );
  process.exit(1);
}
