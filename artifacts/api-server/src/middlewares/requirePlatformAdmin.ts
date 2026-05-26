import type { Request, Response, NextFunction } from "express";
import { isPlatformAdminRole } from "../lib/roles";
import { requireAuth } from "./requireAuth";

/** Requires a valid platform super-admin session. */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!isPlatformAdminRole(req.session?.role ?? "")) {
      res.status(403).json({ error: "Platform administrator access required" });
      return;
    }
    next();
  });
}
