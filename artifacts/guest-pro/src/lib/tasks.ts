/**
 * Staff tasks — typed API client for /api/tasks (manager-only).
 */

import { customFetch } from "@workspace/api-client-react";

export const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskAssignee {
  id: number;
  firstName: string | null;
  lastName: string | null;
  staffDepartment: string | null;
  isActive: boolean;
}

export interface StaffTask {
  id: number;
  hotelId: number;
  assigneeUserId: number;
  createdByUserId: number;
  title: string;
  description: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  assignee: TaskAssignee;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  assigneeUserId: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  assigneeUserId?: number;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  status?: TaskStatus;
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

export async function listTasks(from: string, to: string): Promise<StaffTask[]> {
  const params = new URLSearchParams({ from, to });
  return apiFetch<StaffTask[]>(`/api/tasks?${params}`);
}

export async function createTask(data: CreateTaskInput): Promise<StaffTask> {
  return apiFetch<StaffTask>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: number, data: UpdateTaskInput): Promise<StaffTask> {
  return apiFetch<StaffTask>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cancelTask(id: number): Promise<void> {
  await apiFetch<null>(`/api/tasks/${id}`, { method: "DELETE" });
}

export function assigneeDisplayName(assignee: TaskAssignee): string {
  const full = [assignee.firstName, assignee.lastName].filter(Boolean).join(" ");
  return full || `#${assignee.id}`;
}

export const TASKS_QUERY_KEY = ["tasks"] as const;
