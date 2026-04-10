/**
 * Tracking — frontend domain types + API client functions.
 *
 * All tracking-related data fetching is centralised here.
 * No fetch calls are scattered in components or hooks.
 */

import { customFetch } from "@workspace/api-client-react";

// ---------------------------------------------------------------------------
// Domain types (mirrors the backend TrackingStatus enum)
// ---------------------------------------------------------------------------

export type TrackingStatus =
  | "IN_HOTEL_AND_ON_WIFI"
  | "IN_HOTEL_NOT_ON_WIFI"
  | "OUTSIDE_HOTEL"
  | "UNKNOWN";

export interface TrackingNetwork {
  id: number;
  hotelId: number;
  ipOrCidr: string;
  label: string | null;
  createdAt: string;
}

export interface TrackingConfig {
  id: number;
  hotelId: number;
  isEnabled: boolean;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingConfigResponse {
  config: TrackingConfig | null;
  networks: TrackingNetwork[];
}

export interface GuestPresence {
  guestId: number;
  status: TrackingStatus;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracyMeters: number | null;
  lastSourceIp: string | null;
  lastSeenAt: string | null;
}

export interface HeartbeatPayload {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}

/** Debug diagnostics returned by the heartbeat endpoint. */
export interface HeartbeatDebug {
  guestId: number;
  hotelId: number;
  browserLat: number | null;
  browserLng: number | null;
  browserAccuracyMeters: number | null;
  resolvedSourceIp: string;
  reqIp: string | null;
  reqIps: string[];
  xForwardedFor: string | string[] | null;
  socketRemoteAddress: string | null;
  hotelCenterLat: number;
  hotelCenterLng: number;
  hotelRadiusMeters: number;
  trackingEnabled: boolean;
  allowedNetworks: string[];
  distanceMeters: number | null;
  isInGeofence: boolean | null;
  isOnAllowedNetwork: boolean | null;
  unknownReason: string | null;
  resolvedStatus: TrackingStatus;
}

export interface HeartbeatResponse {
  status: TrackingStatus;
  sourceIp: string;
  debug: HeartbeatDebug;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const TRACKING_STATUS_LABEL: Record<TrackingStatus, string> = {
  IN_HOTEL_AND_ON_WIFI:   "In hotel",
  IN_HOTEL_NOT_ON_WIFI:   "In hotel · not on hotel network",
  OUTSIDE_HOTEL:          "Out of hotel",
  UNKNOWN:                "Unknown",
};

export const TRACKING_STATUS_SHORT: Record<TrackingStatus, string> = {
  IN_HOTEL_AND_ON_WIFI:   "In hotel",
  IN_HOTEL_NOT_ON_WIFI:   "In hotel",
  OUTSIDE_HOTEL:          "Out of hotel",
  UNKNOWN:                "Unknown",
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

const BASE = "/api";

export async function getTrackingConfig(): Promise<TrackingConfigResponse> {
  return customFetch<TrackingConfigResponse>(`${BASE}/tracking/config`);
}

export async function saveTrackingConfig(data: {
  isEnabled: boolean;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  notes: string;
}): Promise<TrackingConfig> {
  return customFetch<TrackingConfig>(`${BASE}/tracking/config`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function addTrackingNetwork(data: {
  ipOrCidr: string;
  label: string;
}): Promise<TrackingNetwork> {
  return customFetch<TrackingNetwork>(`${BASE}/tracking/networks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteTrackingNetwork(id: number): Promise<void> {
  await customFetch<void>(`${BASE}/tracking/networks/${id}`, {
    method: "DELETE",
  });
}

export async function sendPresenceHeartbeat(
  payload: HeartbeatPayload
): Promise<HeartbeatResponse> {
  return customFetch<HeartbeatResponse>(`${BASE}/tracking/heartbeat`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getGuestPresences(): Promise<GuestPresence[]> {
  return customFetch<GuestPresence[]>(`${BASE}/tracking/presences`);
}

export interface MyIpResponse {
  sourceIp: string;
  reqIp: string | null;
  reqIps: string[];
  xForwardedFor: string | string[] | null;
  socketRemoteAddress: string | null;
}

/** Returns the IP address the server resolves from the current request. */
export async function getMyIp(): Promise<MyIpResponse> {
  return customFetch<MyIpResponse>(`${BASE}/tracking/my-ip`);
}
