import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { isStaffRole } from "../lib/roles";

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

/** Verifies the Bearer token and attaches the decoded session to req.session. */
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

/**
 * Requires an authenticated manager (role === "manager").
 * Use this for sensitive hotel management operations.
 */
export function requireManager(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.session?.role !== "manager") {
      res.status(403).json({ error: "Manager access required" });
      return;
    }
    next();
  });
}

/**
 * Requires any authenticated staff member (manager or personnel).
 * Use this for operations both roles are permitted to perform (e.g. guest creation, guest list).
 */
export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!isStaffRole(req.session?.role ?? "")) {
      res.status(403).json({ error: "Staff access required" });
      return;
    }
    next();
  });
}

/** Requires an authenticated hotel guest. */
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
 * Ensures the authenticated user belongs to the hotel in the route param `:hotelId`.
 * Use after requireManager, requireStaff, or requireGuest.
 */
export function requireHotelScope(req: Request, res: Response, next: NextFunction): void {
  const paramHotelId = req.params.hotelId
    ? parseInt(req.params.hotelId, 10)
    : NaN;
  if (isNaN(paramHotelId)) {
    next();
    return;
  }
  if (req.session?.hotelId !== paramHotelId) {
    res.status(403).json({ error: "Access denied to this hotel" });
    return;
  }
  next();
}
