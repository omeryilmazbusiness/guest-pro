/**
 * Staff portal — employee self-service task API client.
 */

import { customFetch } from "@workspace/api-client-react";

export interface StaffPortalEmployee {
  id: number;
  name: string;
  employeeNumber: string | null;
  department: string | null;
  departmentLabel: string | null;
}

export interface StaffPortalManager {
  id: number;
  name: string;
  department: string;
  departmentLabel: string;
}

export interface StaffPortalMe {
  employee: StaffPortalEmployee;
  manager: StaffPortalManager | null;
}

export interface StaffPortalTask {
  id: number;
  title: string;
  description: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: string;
  completedAt: string | null;
  isOverdue: boolean;
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
  return "An unexpected error occurred";
}

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

export async function getStaffPortalMe(): Promise<StaffPortalMe> {
  return apiFetch<StaffPortalMe>("/api/staff-portal/me");
}

export async function getStaffPortalTasks(date?: string): Promise<StaffPortalTask[]> {
  const params = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiFetch<StaffPortalTask[]>(`/api/staff-portal/tasks${params}`);
}

export async function completeStaffPortalTask(id: number): Promise<StaffPortalTask> {
  return apiFetch<StaffPortalTask>(`/api/staff-portal/tasks/${id}/complete`, {
    method: "PATCH",
  });
}

export const STAFF_PORTAL_QUERY_KEY = ["staff-portal"] as const;

export function formatTaskTimeRange(startIso: string, endIso: string, locale = "en-GB"): string {
  const fmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  return `${fmt.format(new Date(startIso))} – ${fmt.format(new Date(endIso))}`;
}
