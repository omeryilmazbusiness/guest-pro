import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Monorepo root .env (same as api-server DOTENV_CONFIG_PATH=../../.env)
loadEnv({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Add it to the repo root .env file or export it in your shell.",
  );
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
