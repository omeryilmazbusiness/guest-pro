import { customFetch } from "@workspace/api-client-react";

export type ServiceRequestType =
  | "FOOD_ORDER"
  | "SUPPORT_REQUEST"
  | "CARE_PROFILE_UPDATE"
  | "GENERAL_SERVICE_REQUEST";

export type ServiceRequestStatus = "open" | "in_progress" | "resolved";

export interface ServiceRequest {
  id: number;
  guestId: number;
  hotelId: number;
  roomNumber: string;
  requestType: ServiceRequestType;
  summary: string;
  structuredData?: Record<string, unknown> | null;
  sourceSessionId?: number | null;
  status: ServiceRequestStatus;
  guestFirstName: string;
  guestLastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestPayload {
  requestType: ServiceRequestType;
  summary: string;
  structuredData?: Record<string, unknown>;
  sourceSessionId?: number;
}

/**
 * Create a service request for the authenticated guest.
 *
 * NOTE: customFetch already parses the JSON body on success and throws an
 * ApiError on HTTP error — never treat its return value as a Response object.
 */
export async function createServiceRequest(
  payload: CreateServiceRequestPayload
): Promise<ServiceRequest> {
  return customFetch<ServiceRequest>("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listServiceRequests(params?: {
  type?: ServiceRequestType;
  status?: ServiceRequestStatus;
}): Promise<ServiceRequest[]> {
  const url = new URL("/api/requests", window.location.origin);
  if (params?.type) url.searchParams.set("type", params.type);
  if (params?.status) url.searchParams.set("status", params.status);
  return customFetch<ServiceRequest[]>(url.pathname + url.search);
}

/**
 * Fetch service requests created by the currently authenticated guest.
 */
export async function listMyRequests(): Promise<ServiceRequest[]> {
  return customFetch<ServiceRequest[]>("/api/requests/mine");
}

export async function updateServiceRequestStatus(
  id: number,
  status: ServiceRequestStatus
): Promise<ServiceRequest> {
  return customFetch<ServiceRequest>(`/api/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export const REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  FOOD_ORDER: "Yemek Siparişi",
  SUPPORT_REQUEST: "Destek Talebi",
  CARE_PROFILE_UPDATE: "Care About Me",
  GENERAL_SERVICE_REQUEST: "Genel Talep",
};

export const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Tamamlandı",
};

export async function deleteServiceRequest(id: number): Promise<void> {
  await customFetch<void>(`/api/requests/${id}`, { method: "DELETE" });
}

export async function deleteMyServiceRequest(id: number): Promise<void> {
  await customFetch<void>(`/api/requests/${id}/guest`, { method: "DELETE" });
}
