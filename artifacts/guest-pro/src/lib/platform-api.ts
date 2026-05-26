const PLATFORM_TOKEN_KEY = "guestpro_platform_token";

export function getPlatformToken(): string | null {
  return localStorage.getItem(PLATFORM_TOKEN_KEY);
}

export function setPlatformToken(token: string | null): void {
  if (token) localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  else localStorage.removeItem(PLATFORM_TOKEN_KEY);
}

async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getPlatformToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new Error(
      "Cannot reach the API server. Run pnpm dev from the project root and wait for “Server listening on 0.0.0.0:3000”.",
    );
  }
  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) {
    const payload = data as { error?: string; retryAfterMs?: number };
    if (payload.error) {
      const err = new Error(payload.error) as Error & { retryAfterMs?: number };
      if (payload.retryAfterMs) err.retryAfterMs = payload.retryAfterMs;
      throw err;
    }
    if (res.status === 404) {
      throw new Error(
        "API route not found — restart the API server (pnpm dev) so platform routes are loaded.",
      );
    }
    if (res.status === 413) {
      throw new Error("Logo file is too large for the server. Try a smaller image.");
    }
    if (res.status >= 500) {
      throw new Error(
        "API server is unavailable. Stop pnpm dev (Ctrl+C) and start it again from the project root.",
      );
    }
    throw new Error(`Request failed (${res.status})`);
  }
  return data as T;
}

export interface PlatformAdminUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "platform_admin";
}

export type HotelPlanTier = "starter" | "growth" | "enterprise";

export interface PlatformHotel {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  countryCode: string | null;
  isActive: boolean;
  planTier: HotelPlanTier;
  subscriptionRenewsAt: string | null;
  platformNotes: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformHotelTrack extends PlatformHotel {
  managerCount: number;
  staffCount: number;
  activeGuestCount: number;
  totalGuestCount: number;
  lastActivityAt: string | null;
  generalManager: { email: string; name: string | null } | null;
}

export type PlatformEmailDelivery = "smtp" | "console";

export interface PlatformLoginChallenge {
  challengeId: string;
  expiresAt: string;
  expiresInSeconds: number;
  verificationEmailMasked: string;
  emailDelivery: PlatformEmailDelivery;
  /** False when the server reused a recent OTP (no duplicate email). */
  resent?: boolean;
}

export function platformLogin(email: string, password: string) {
  return platformFetch<PlatformLoginChallenge>("/platform/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function platformVerifyOtp(challengeId: string, code: string, email: string) {
  return platformFetch<{ token: string; user: PlatformAdminUser }>("/platform/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ challengeId, code, email }),
  });
}

export function getPlatformSettings() {
  return platformFetch<{ verificationEmail: string }>("/platform/settings");
}

export function updatePlatformSettings(body: { verificationEmail: string }) {
  return platformFetch<{ verificationEmail: string }>("/platform/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function platformMe() {
  return platformFetch<PlatformAdminUser>("/platform/auth/me");
}

export function changePlatformPassword(newPassword: string) {
  return platformFetch<{ ok: true }>("/platform/auth/password", {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
}

export function listPlatformTrack() {
  return platformFetch<{ properties: PlatformHotelTrack[] }>("/platform/track");
}

export function listPlatformHotels() {
  return platformFetch<{ hotels: PlatformHotel[] }>("/platform/hotels");
}

export function createPlatformHotel(body: {
  name: string;
  appName?: string;
  address: string;
  countryCode: string;
}) {
  return platformFetch<{
    hotel: PlatformHotel;
    paths: { login: string; manager: string; guest: string };
  }>("/platform/hotels", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createPlatformHotelManager(
  hotelId: number,
  body: { email: string; password: string; firstName: string; lastName: string },
) {
  return platformFetch<{
    hotel: Pick<PlatformHotel, "id" | "name" | "slug">;
    manager: { id: number; email: string; firstName: string | null; lastName: string | null };
    loginUrl: string;
  }>(`/platform/hotels/${hotelId}/managers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface PublicHotelTenant {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  branding: {
    appName: string;
    tagline: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    logoUrl: string | null;
    welcomeText: string | null;
  } | null;
}

export function updatePlatformHotel(
  hotelId: number,
  body: {
    name?: string;
    address?: string;
    countryCode?: string;
    slug?: string;
    isActive?: boolean;
    planTier?: HotelPlanTier;
    subscriptionRenewsAt?: string | null;
    platformNotes?: string | null;
  },
) {
  return platformFetch<{ hotel: PlatformHotel }>(`/platform/hotels/${hotelId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadPlatformHotelLogo(hotelId: number, image: Blob): Promise<{ logoUrl: string }> {
  const token = getPlatformToken();
  const headers = new Headers();
  headers.set("Content-Type", image.type || "image/jpeg");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api/platform/hotels/${hotelId}/logo`, {
    method: "PUT",
    headers,
    body: image,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Logo upload failed (${res.status})`);
  }
  return data as { logoUrl: string };
}

export function deletePlatformHotelLogo(hotelId: number) {
  return platformFetch<{ logoUrl: null }>(`/platform/hotels/${hotelId}/logo`, {
    method: "DELETE",
  });
}

export function deletePlatformHotel(hotelId: number, confirmSlug: string) {
  return platformFetch<{ deleted: true; slug: string }>(
    `/platform/hotels/${hotelId}/delete`,
    {
      method: "POST",
      body: JSON.stringify({ confirmSlug: confirmSlug.trim() }),
    },
  );
}

/** @deprecated Use updatePlatformHotel */
export function patchPlatformHotel(hotelId: number, body: { isActive: boolean }) {
  return updatePlatformHotel(hotelId, body);
}

export function resetPlatformManagerPassword(
  hotelId: number,
  managerId: number,
  newPassword: string,
) {
  return platformFetch<{ ok: true; managerId: number }>(
    `/platform/hotels/${hotelId}/managers/${managerId}/reset-password`,
    { method: "POST", body: JSON.stringify({ newPassword }) },
  );
}

export interface PlatformAuditLog {
  id: number;
  hotelId: number | null;
  actorId: number | null;
  actorType: string | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function listPlatformAuditLogs(limit = 50) {
  return platformFetch<{ logs: PlatformAuditLog[] }>(`/platform/audit-logs?limit=${limit}`);
}

export function listPlatformHotelManagers(hotelId: number) {
  return platformFetch<{
    managers: Array<{
      id: number;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
      isActive: boolean;
      createdAt: string;
    }>;
  }>(`/platform/hotels/${hotelId}/managers`);
}

export function fetchPublicHotel(slug: string) {
  return fetch(`/api/public/hotels/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Hotel not found");
    return data as PublicHotelTenant;
  });
}
