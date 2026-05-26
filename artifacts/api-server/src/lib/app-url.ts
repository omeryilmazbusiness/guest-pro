/**
 * Build absolute tenant-scoped frontend URLs (QR codes, email links).
 */

import type { Request } from "express";
import { env } from "../config/env";

export function buildTenantPath(slug: string, segment: string): string {
  const base = slug.replace(/^\/+|\/+$/g, "");
  const path = segment.startsWith("/") ? segment : `/${segment}`;
  return `/${base}${path}`;
}

export function buildTenantAppUrl(appBase: string, slug: string, segment: string): string {
  const root = appBase.replace(/\/+$/, "");
  return `${root}${buildTenantPath(slug, segment)}`;
}

export function getAppBaseFromRequest(req: Request): string {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  return `${proto}://${host}`;
}
