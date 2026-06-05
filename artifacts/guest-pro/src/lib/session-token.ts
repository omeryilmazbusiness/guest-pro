/** Client-side session token helpers (scheduling only — never for authorization). */

const REFRESH_LEAD_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type DecodedSessionClaims = {
  exp: number;
  role?: string;
};

export function decodeSessionClaims(token: string): DecodedSessionClaims | null {
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return null;
    const payload = atob(token.slice(0, dot));
    const data = JSON.parse(payload) as { exp?: number; role?: string };
    if (typeof data.exp !== "number") return null;
    return { exp: data.exp, role: data.role };
  } catch {
    return null;
  }
}

export function shouldRefreshSessionToken(token: string | null): boolean {
  if (!token) return false;
  const claims = decodeSessionClaims(token);
  if (!claims) return true;
  return claims.exp - Date.now() <= REFRESH_LEAD_MS;
}

export function isSessionTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const claims = decodeSessionClaims(token);
  if (!claims) return true;
  return Date.now() > claims.exp;
}

export const SESSION_REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MS;
