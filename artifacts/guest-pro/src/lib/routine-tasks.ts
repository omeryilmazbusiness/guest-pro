/**
 * Routine tasks — recurring task template API client.
 */

import { customFetch } from "@workspace/api-client-react";

export interface RoutineTaskAssignee {
  id: number;
  name: string;
  staffDepartment: string | null;
}

export interface RoutineTask {
  id: number;
  hotelId: number;
  createdByUserId: number;
  title: string;
  description: string | null;
  assigneeUserId: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignee: RoutineTaskAssignee;
}

export interface CreateRoutineTaskInput {
  title: string;
  description?: string | null;
  assigneeUserId: number;
  startTime: string;
  endTime: string;
}

export interface UpdateRoutineTaskInput {
  title?: string;
  description?: string | null;
  assigneeUserId?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
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

export async function listRoutineTasks(): Promise<RoutineTask[]> {
  return apiFetch<RoutineTask[]>("/api/routine-tasks");
}

export async function createRoutineTask(data: CreateRoutineTaskInput): Promise<RoutineTask> {
  return apiFetch<RoutineTask>("/api/routine-tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRoutineTask(
  id: number,
  data: UpdateRoutineTaskInput,
): Promise<RoutineTask> {
  return apiFetch<RoutineTask>(`/api/routine-tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRoutineTask(id: number): Promise<void> {
  await apiFetch<null>(`/api/routine-tasks/${id}`, { method: "DELETE" });
}

export const ROUTINE_TASKS_QUERY_KEY = ["routine-tasks"] as const;
