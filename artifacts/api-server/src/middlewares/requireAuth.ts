import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      session?: {
        userId: number;
        role: string;
        hotelId: number;
        guestId?: number;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.session = payload;
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.session?.role !== "manager") {
      res.status(403).json({ error: "Manager access required" });
      return;
    }
    next();
  });
}

export function requireGuest(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.session?.role !== "guest") {
      res.status(403).json({ error: "Guest access required" });
      return;
    }
    next();
  });
}

/**
 * Ensures the authenticated user belongs to the hotel in the route param
 * or query param `:hotelId`. Use after requireManager or requireGuest.
 * Example:  router.get("/hotels/:hotelId/data", requireManager, requireHotelScope, handler)
 */
export function requireHotelScope(req: Request, res: Response, next: NextFunction): void {
  const paramHotelId = req.params.hotelId
    ? parseInt(req.params.hotelId, 10)
    : NaN;
  if (isNaN(paramHotelId)) {
    next(); // No hotelId param — nothing to enforce
    return;
  }
  if (req.session?.hotelId !== paramHotelId) {
    res.status(403).json({ error: "Access denied to this hotel" });
    return;
  }
  next();
}
