import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { env } from "./config/env";

const app: Express = express();

// T-06: Trust exactly as many proxy hops as configured so req.ip always
// reflects the real client IP regardless of the deployment topology.
app.set("trust proxy", env.TRUST_PROXY_HOPS);

// In production, only allow the configured frontend origin.
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
        return {
          id: req.id,
          method: req.method,
          // Strip query string from logs to avoid tokens appearing in access logs
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(cors(corsOptions));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

app.use("/api", router);

export default app;
