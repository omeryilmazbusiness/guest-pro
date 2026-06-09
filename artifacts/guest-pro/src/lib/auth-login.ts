/**
 * Hotel tenant auth — typed login client (mirrors POST /api/auth/login).
 * Keeps login payloads out of generated OpenAPI types until spec is regenerated.
 */

import { customFetch } from "@workspace/api-client-react";

export interface AuthLoginUser {
  id: number;
  role: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  roomNumber?: string | null;
  guestId?: number | null;
  hotelId?: number;
  staffDepartment?: string | null;
  employeeNumber?: string | null;
}

export interface AuthLoginResponse {
  role: string;
  token: string;
  user: AuthLoginUser;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if ((err as Error & { data?: unknown }).data != null) {
      const body = (err as Error & { data: unknown }).data;
      if (typeof body === "object" && body !== null && "error" in body) {
        const msg = (body as { error: unknown }).error;
        if (typeof msg === "string" && msg.length > 0) return msg;
      }
    }
    if (err.message) return err.message;
  }
  return "Sign-in failed";
}

async function authLogin<T extends AuthLoginResponse>(body: Record<string, unknown>): Promise<T> {
  try {
    return await customFetch<T>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export function loginAsGuest(guestKey: string, hotelSlug?: string): Promise<AuthLoginResponse> {
  return authLogin({
    type: "guest",
    guestKey: guestKey.trim().toUpperCase(),
    ...(hotelSlug ? { hotelSlug } : {}),
  });
}

export function loginAsManager(
  email: string,
  password: string,
  hotelSlug?: string,
): Promise<AuthLoginResponse> {
  return authLogin({
    type: "manager",
    email,
    password,
    ...(hotelSlug ? { hotelSlug } : {}),
  });
}

export function loginAsRestaurant(
  email: string,
  password: string,
  hotelSlug?: string,
): Promise<AuthLoginResponse> {
  return authLogin({
    type: "manager",
    email,
    password,
    portal: "restaurant",
    ...(hotelSlug ? { hotelSlug } : {}),
  });
}

export function loginAsEmployee(
  employeeNumber: string,
  hotelSlug: string,
): Promise<AuthLoginResponse> {
  return authLogin({
    type: "employee",
    employeeNumber: employeeNumber.trim(),
    hotelSlug,
  });
}
