import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// T-10: Tunable connection pool — configure via env vars in production.
// Sensible defaults work for small deployments; increase DB_POOL_MAX for
// high-concurrency scenarios (rule of thumb: 2-4 x vCPU count of DB server).
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max:                     parseInt(process.env.DB_POOL_MAX                    ?? "10",    10),
  idleTimeoutMillis:       parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS        ?? "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT_MS  ?? "5000",  10),
});

// Surface unexpected idle-client errors in monitoring instead of silently
// crashing a background process.
pool.on("error", (err) => {
  console.error("[pg-pool] unexpected error on idle client", err);
});

export const db = drizzle(pool, { schema });

// T-09: runMigrations() is called once at startup (see api-server/src/index.ts).
// It applies all pending SQL migration files from the migrations/ folder.
// This is the ONLY safe way to modify the production schema.
export async function runMigrations(): Promise<void> {
  const migrationsFolder =
    process.env.MIGRATIONS_PATH ??
    path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../../migrations"
    );
  await migrate(db, { migrationsFolder });
}

export * from "./schema";
