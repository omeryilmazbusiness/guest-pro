/**
 * Staff management — API client helpers.
 *
 * Corresponds to the manager-only /api/staff routes.
 * Uses the shared customFetch which automatically injects the Bearer token.
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

export const DEPARTMENT_COLOURS: Record<StaffDepartment, { bg: string; text: string; border: string }> = {
  HOUSEKEEPING: { bg: "bg-teal-50",    text: "text-teal-700",   border: "border-teal-100" },
  BELLMAN:      { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-100" },
  RECEPTION:    { bg: "bg-sky-50",     text: "text-sky-700",    border: "border-sky-100" },
  RESTAURANT:   { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-100" },
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

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await customFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

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

export async function updateStaff(id: number, data: UpdateStaffInput): Promise<StaffMember> {
  return apiFetch<StaffMember>(`/api/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deactivateStaff(id: number): Promise<void> {
  return apiFetch<void>(`/api/staff/${id}`, { method: "DELETE" });
}

/** Returns the formatted display name for a staff member. */
export function staffDisplayName(member: StaffMember): string {
  const full = [member.firstName, member.lastName].filter(Boolean).join(" ");
  return full || member.email;
}
