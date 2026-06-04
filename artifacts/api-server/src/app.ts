import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { env } from "./config/env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const app: Express = express();

app.set("trust proxy", env.TRUST_PROXY_HOPS);

const corsOptions: cors.CorsOptions =
  env.NODE_ENV === "production" && env.ALLOWED_ORIGIN
    ? {
        origin: env.ALLOWED_ORIGIN,
        credentials: false,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }
    : { origin: true };

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(cors(corsOptions));

/** Binary hotel logo upload (PUT) — must run before express.json */
app.use((req, res, next) => {
  if (req.method === "PUT" && /^\/api\/platform\/hotels\/\d+\/logo\/?$/.test(req.path)) {
    return express.raw({
      type: ["image/jpeg", "image/png", "image/webp", "application/octet-stream"],
      limit: "3mb",
    })(req, res, next);
  }
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", router);

// ── Production: serve the Vite-built frontend ───────────────────────────────
// Built to: artifacts/guest-pro/dist/public  (relative to repo root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// At runtime __dirname = .../artifacts/api-server/dist
// Go up 3 levels: dist -> api-server -> artifacts -> repo-root
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const staticDir = path.join(repoRoot, "artifacts", "guest-pro", "dist", "public");

if (env.NODE_ENV === "production" && existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving frontend static files");

  app.use(
    express.static(staticDir, {
      maxAge: "1y",
      immutable: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // SPA fallback — never return index.html for static asset paths (e.g. missing .mp4 → HTML breaks video)
  app.get("{*path}", (req, res) => {
    const ext = path.extname(req.path).toLowerCase();
    if (
      /\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|webp|svg|ico|css|js|mjs|woff2?|ttf|otf|eot|mp3|wav|pdf)$/i.test(
        ext,
      )
    ) {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else if (env.NODE_ENV === "production") {
  logger.warn({ staticDir }, "Frontend static dir not found — only API is served");
}

export default app;
