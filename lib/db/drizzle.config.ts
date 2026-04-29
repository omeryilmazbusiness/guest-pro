import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running drizzle-kit commands.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  // T-09: Migrations folder gives an auditable, version-controlled history of
  // every schema change. Never use "drizzle-kit push" against production.
  out: path.join(__dirname, "./migrations"),
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  verbose: true,
  strict: true,
});
