import { db, usersTable, guestsTable, guestKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateToken } from "./auth";
import { evaluateStayAccess } from "./guest-stay-policy";
import { deriveLocaleFromCountry } from "./locale";
import { isStaffRole } from "./roles";
import type { SessionTokenPayload } from "./session-policy";

export type RefreshSessionSuccess = {
  ok: true;
  token: string;
  role: string;
  user: {
    id: number;
    role: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    roomNumber: string | null;
    guestId: number | null;
    hotelId: number;
    countryCode?: string;
    language?: string;
    guestKeyDisplay?: string | null;
    staffDepartment?: string | null;
  };
};

export type RefreshSessionFailure = {
  ok: false;
  status: 401 | 403;
  error: string;
  code?: string;
};

export type RefreshSessionResult = RefreshSessionSuccess | RefreshSessionFailure;

/**
 * Re-validate the principal in DB and issue a fresh sliding session token.
 * Called from POST /auth/refresh after cryptographic token verification.
 */
export async function refreshSession(
  payload: SessionTokenPayload,
): Promise<RefreshSessionResult> {
  if (isStaffRole(payload.role)) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));
    if (!user) {
      return { ok: false, status: 401, error: "User not found" };
    }
    if (user.isActive === false) {
      return { ok: false, status: 401, error: "Account deactivated", code: "account_deactivated" };
    }
    if (user.hotelId !== payload.hotelId) {
      return { ok: false, status: 401, error: "Invalid session" };
    }

    const token = generateToken(
      user.id,
      user.role,
      user.hotelId,
      undefined,
      user.staffDepartment ?? null,
    );

    return {
      ok: true,
      token,
      role: user.role,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl ?? null,
        roomNumber: null,
        guestId: null,
        hotelId: user.hotelId,
        staffDepartment: user.staffDepartment ?? null,
      },
    };
  }

  if (payload.role === "guest" && payload.guestId) {
    const [guest] = await db
      .select()
      .from(guestsTable)
      .where(eq(guestsTable.id, payload.guestId));
    if (!guest) {
      return { ok: false, status: 401, error: "Guest not found" };
    }
    if (guest.hotelId !== payload.hotelId) {
      return { ok: false, status: 401, error: "Invalid session" };
    }

    const stayDenial = evaluateStayAccess({
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
    });
    if (stayDenial) {
      return {
        ok: false,
        status: 401,
        error: stayDenial.message,
        code: stayDenial.code,
      };
    }

    const syntheticUserId = guest.id * -1;
    const token = generateToken(syntheticUserId, "guest", guest.hotelId, guest.id);
    const { voiceLocale } = deriveLocaleFromCountry(guest.countryCode ?? "TR");
    const resolvedLanguage = guest.language || voiceLocale;

    const [activeKey] = await db
      .select({ keyDisplay: guestKeysTable.keyDisplay })
      .from(guestKeysTable)
      .where(and(eq(guestKeysTable.guestId, guest.id), eq(guestKeysTable.isActive, true)))
      .limit(1);

    return {
      ok: true,
      token,
      role: "guest",
      user: {
        id: syntheticUserId,
        role: "guest",
        email: null,
        firstName: guest.firstName,
        lastName: guest.lastName,
        avatarUrl: null,
        roomNumber: guest.roomNumber,
        guestId: guest.id,
        hotelId: guest.hotelId,
        countryCode: guest.countryCode ?? "TR",
        language: resolvedLanguage,
        guestKeyDisplay: activeKey?.keyDisplay ?? null,
      },
    };
  }

  return { ok: false, status: 401, error: "Invalid session" };
}
