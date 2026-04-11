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

export async function createServiceRequest(
  payload: CreateServiceRequestPayload
): Promise<ServiceRequest> {
  const response = await customFetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create service request");
  }

  return response.json();
}

export async function listServiceRequests(params?: {
  type?: ServiceRequestType;
  status?: ServiceRequestStatus;
}): Promise<ServiceRequest[]> {
  const url = new URL("/api/requests", window.location.origin);
  if (params?.type) url.searchParams.set("type", params.type);
  if (params?.status) url.searchParams.set("status", params.status);

  const response = await customFetch(url.pathname + url.search);
  if (!response.ok) throw new Error("Failed to fetch service requests");
  return response.json();
}

export async function updateServiceRequestStatus(
  id: number,
  status: ServiceRequestStatus
): Promise<ServiceRequest> {
  const response = await customFetch(`/api/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update status");
  }

  return response.json();
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
