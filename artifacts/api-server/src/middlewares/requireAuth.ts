import type { Request, Response, NextFunction } from "express";
import { verifyToken, verifyTokenForRefresh } from "../lib/auth";
import { isStaffRole } from "../lib/roles";
import {
  canAccessGuestOperations,
  canManageStaff,
  isGeneralManager,
  isAnyManager,
  resolveStaffScope,
} from "../lib/staff-scope";
/**
 * Safely extract a single string from an Express 5 route param.
 * In Express 5, params can be string | string[]; parseInt expects string.
 */
function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] ?? "" : val;
}
declare global {
  namespace Express {
    interface Request {
      session?: {
        userId: number;
        role: string;
        hotelId: number;
        guestId?: number;
        staffDepartment?: string | null;
      };
    }
  }
}

/** Verifies Bearer token (including recently expired) for POST /auth/refresh. */
export function requireRefreshableAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyTokenForRefresh(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.session = payload;
  next();
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
 * Requires General Manager (manager with no department scope).
 * Hotel-wide settings, analytics, delete guest, etc.
 */
export function requireGeneralManager(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const session = req.session!;
    if (!isGeneralManager({ role: session.role, staffDepartment: session.staffDepartment })) {
      res.status(403).json({ error: "General manager access required" });
      return;
    }
    next();
  });
}

/**
 * @deprecated Use requireGeneralManager or requireStaffManager explicitly.
 * Kept as alias for general manager (hotel-wide manager routes).
 */
export function requireManager(req: Request, res: Response, next: NextFunction): void {
  requireGeneralManager(req, res, next);
}

/** General Manager or Department Manager (team & tasks). */
export function requireStaffManager(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const session = req.session!;
    if (!isAnyManager({ role: session.role, staffDepartment: session.staffDepartment })) {
      res.status(403).json({ error: "Manager access required" });
      return;
    }
    next();
  });
}

/** Guest check-in / guest list — General Manager and Reception only. */
export function requireGuestOperations(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const session = req.session!;
    if (!canAccessGuestOperations({ role: session.role, staffDepartment: session.staffDepartment })) {
      res.status(403).json({ error: "Guest operations access required" });
      return;
    }
    next();
  });
}

/** Staff roster management — managers only (scoped on route handlers). */
export function requireStaffManagement(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const session = req.session!;
    if (!canManageStaff({ role: session.role, staffDepartment: session.staffDepartment })) {
      res.status(403).json({ error: "Staff management access required" });
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

/** Staff employee portal — field personnel (not reception/restaurant). */
export function requireStaffPersonnel(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const session = req.session!;
    const scope = resolveStaffScope({
      role: session.role,
      staffDepartment: session.staffDepartment,
    });
    if (scope !== "staff_personnel") {
      res.status(403).json({ error: "Staff portal access required" });
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
  const paramHotelId = paramStr(req.params.hotelId)
    ? parseInt(paramStr(req.params.hotelId), 10)
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
