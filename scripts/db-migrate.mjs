// Applies the SQL files in ./drizzle to the database in DATABASE_URL.
// Uses the same Neon HTTP driver as the app. Never prints the connection string.
//
// Tracking: Drizzle records each applied migration (hash + timestamp) in
// drizzle.__drizzle_migrations and only runs files newer than the last recorded one. Running
// this twice is a no-op: the second run prints "No new migrations" and exits 0.
//
// If a run fails halfway: the neon-http driver has no interactive transactions, so Drizzle runs
// each statement on its own and writes the tracking rows only after every migration succeeded.
// Statements that ran before the failure stay applied, and none of that run is recorded. The
// next run starts that migration again from its first statement, which then fails on what
// already exists (e.g. "relation already exists"). To recover: look at what was created, then
// either drop it and rerun, or finish the migration by hand and insert its tracking row.
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

/** How many migrations the database has recorded (0 before the first run). */
async function appliedCount(sql) {
  const [table] =
    await sql`select to_regclass('drizzle.__drizzle_migrations') as name`;
  if (!table?.name) return 0;
  const [row] =
    await sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
  return row.count;
}

try {
  const sql = neon(url);
  const before = await appliedCount(sql);
  await migrate(drizzle({ client: sql }), { migrationsFolder: "./drizzle" });
  const after = await appliedCount(sql);
  console.log(
    after === before
      ? `No new migrations. ${after} already applied.`
      : `Applied ${after - before} migration(s). ${after} applied in total.`,
  );
} catch (error) {
  // Class name and SQLSTATE only: driver messages can echo connection details or SQL.
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : error;
  const name = cause instanceof Error ? cause.name : "unknown error";
  const code =
    typeof cause?.code === "string" && /^[0-9A-Z]{5}$/.test(cause.code)
      ? `, SQLSTATE ${cause.code}`
      : "";
  console.error(`Migration failed (${name}${code}).`);
  process.exit(1);
}
