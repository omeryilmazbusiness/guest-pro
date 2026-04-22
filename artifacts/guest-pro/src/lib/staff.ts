/**
 * Staff management — typed API client for the /api/staff endpoints.
 *
 * customFetch (from @workspace/api-client-react) is NOT a thin fetch wrapper.
 * It:
 *   1. Automatically attaches the Bearer token via the registered auth getter.
 *   2. Parses the response body and returns the result as T directly.
 *   3. Throws ApiError (with .status and .data) for any non-2xx response.
 *   4. Returns null for 204 No Content bodies automatically.
 *
 * Therefore all functions here receive T back from customFetch — not a
 * Response object. There is NO .ok / .status / .json() usage here.
 */

import { customFetch } from "@workspace/api-client-react";

// ── Domain types ──────────────────────────────────────────────────────────────

export const STAFF_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RECEPTION",
  "RESTAURANT",
] as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  HOUSEKEEPING: "Housekeeping",
  BELLMAN:      "Bellman",
  RECEPTION:    "Reception",
  RESTAURANT:   "Restaurant",
};

export const DEPARTMENT_COLOURS: Record<
  StaffDepartment,
  { bg: string; text: string; border: string }
> = {
  HOUSEKEEPING: { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-100" },
  BELLMAN:      { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100" },
  RECEPTION:    { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-100" },
  RESTAURANT:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-100" },
};

export interface StaffMember {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  staffDepartment: StaffDepartment | null;
  isActive: boolean;
  createdAt: string;
}

// ── Internal error-normaliser ─────────────────────────────────────────────────
//
// customFetch throws ApiError (which extends Error and carries .status + .data)
// for any non-2xx response.  We unwrap the backend's { error: string } payload
// and re-throw a plain Error so callers can display it directly via err.message.
//
// ApiError is NOT exported from the package index so we duck-type it via the
// name property that the class sets explicitly: `readonly name = "ApiError"`.

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // ApiError carries the parsed body in .data
    if ((err as Error & { data?: unknown }).data != null) {
      const body = (err as Error & { data: unknown }).data;
      if (typeof body === "object" && body !== null && "error" in body) {
        const msg = (body as { error: unknown }).error;
        if (typeof msg === "string" && msg.length > 0) return msg;
      }
    }
    // Fall back to the message ApiError generates internally
    if (err.message) return err.message;
  }
  return "An unexpected error occurred";
}

// ── Core fetch helper ─────────────────────────────────────────────────────────
//
// customFetch<T> returns T (the parsed body), not a Response.
// Errors are thrown, not encoded in a return value.

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await customFetch<T>(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ── Public API functions ──────────────────────────────────────────────────────

export async function listStaff(): Promise<StaffMember[]> {
  return apiFetch<StaffMember[]>("/api/staff");
}

export interface CreateStaffInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  staffDepartment: StaffDepartment;
}

export async function createStaff(data: CreateStaffInput): Promise<StaffMember> {
  return apiFetch<StaffMember>("/api/staff", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateStaffInput {
  firstName?: string;
  lastName?: string;
  staffDepartment?: StaffDepartment;
  isActive?: boolean;
}

export async function updateStaff(
  id: number,
  data: UpdateStaffInput,
): Promise<StaffMember> {
  return apiFetch<StaffMember>(`/api/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Soft-deactivates a staff member (DELETE → 204 No Content).
 * customFetch returns null for 204 bodies; we cast to void.
 */
export async function deactivateStaff(id: number): Promise<void> {
  await apiFetch<null>(`/api/staff/${id}`, { method: "DELETE" });
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function staffDisplayName(member: StaffMember): string {
  const full = [member.firstName, member.lastName].filter(Boolean).join(" ");
  return full || member.email;
}
