import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

const authRoute = read("src/routes/auth.ts");
const roles = read("src/lib/roles.ts");
const policy = read("src/lib/session-policy.ts");
const refresh = read("src/lib/session-refresh.ts");
const requireAuth = read("src/middlewares/requireAuth.ts");
const useAuth = readFileSync(
  path.join(root, "../guest-pro/src/hooks/use-auth.tsx"),
  "utf8",
);

const checks = [
  [authRoute.includes('router.post("/auth/refresh"'), "POST /auth/refresh route exists"],
  [authRoute.includes("requireRefreshableAuth"), "refresh uses refreshable auth middleware"],
  [authRoute.includes("account_deactivated"), "/auth/me checks staff isActive"],
  [roles.includes("sessionTtlForRole"), "roles delegate TTL to session-policy"],
  [policy.includes("TOKEN_REFRESH_GRACE_MS"), "refresh grace defined"],
  [refresh.includes("evaluateStayAccess"), "guest refresh enforces stay window"],
  [requireAuth.includes("verifyTokenForRefresh"), "refreshable token verification exists"],
  [useAuth.includes("usePersistentSession"), "frontend wires persistent session hook"],
];

let failed = 0;
for (const [ok, label] of checks) {
  if (!ok) {
    console.error("FAIL:", label);
    failed++;
  } else {
    console.log("ok:", label);
  }
}

if (failed > 0) process.exit(1);
console.log("persistent session self-test passed");
