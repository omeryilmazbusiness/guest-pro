/**
 * TrackingPolicy — Active Tracking System domain logic.
 *
 * Pure functions only: no DB, no network, no side effects.
 * All tracking status resolution is centralised here — no logic is scattered
 * in routes, controllers, or UI components.
 *
 * Status model:
 *   IN_HOTEL_AND_ON_WIFI   — inside geofence AND source IP matches hotel network
 *   IN_HOTEL_NOT_ON_WIFI   — inside geofence but NOT on hotel network
 *   OUTSIDE_HOTEL          — outside geofence (regardless of network)
 *   UNKNOWN                — missing location data or tracking disabled
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackingStatus =
  | "IN_HOTEL_AND_ON_WIFI"
  | "IN_HOTEL_NOT_ON_WIFI"
  | "OUTSIDE_HOTEL"
  | "UNKNOWN";

export interface GeofenceConfig {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface ResolveStatusParams {
  config: GeofenceConfig & { isEnabled: boolean };
  networks: Array<{ ipOrCidr: string }>;
  /** Guest-reported latitude (may be null/undefined if permission denied). */
  lat: number | null | undefined;
  /** Guest-reported longitude (may be null/undefined if permission denied). */
  lng: number | null | undefined;
  /** Source IP extracted from the incoming request. */
  sourceIp: string;
}

// ---------------------------------------------------------------------------
// Geofence calculation — Haversine formula
// ---------------------------------------------------------------------------

/**
 * Returns the great-circle distance in metres between two WGS-84 coordinates.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true if the point (lat, lng) falls within the geofence.
 */
export function isInGeofence(
  lat: number,
  lng: number,
  config: GeofenceConfig
): boolean {
  const dist = haversineMeters(lat, lng, config.centerLat, config.centerLng);
  return dist <= config.radiusMeters;
}

// ---------------------------------------------------------------------------
// IP / CIDR matching
// ---------------------------------------------------------------------------

function ipToUint32(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) return NaN;
  let n = 0;
  for (const part of parts) {
    const byte = parseInt(part, 10);
    if (isNaN(byte) || byte < 0 || byte > 255) return NaN;
    n = (n << 8) | byte;
  }
  return n >>> 0;
}

/**
 * Returns true if `ip` matches the given CIDR range or exact IP address.
 * Supports IPv4 only. IPv6 addresses are never matched.
 */
export function matchesCidr(ip: string, cidr: string): boolean {
  // IPv6 — skip
  if (ip.includes(":")) return false;

  const [network, prefixStr] = cidr.split("/");

  if (!prefixStr) {
    // Exact IP match
    return ip.trim() === (network ?? "").trim();
  }

  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const ipInt = ipToUint32(ip);
  const netInt = ipToUint32(network ?? "");
  if (isNaN(ipInt) || isNaN(netInt)) return false;

  if (prefix === 0) return true;
  const mask = (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (netInt & mask);
}

/**
 * Returns true if `ip` matches any of the supplied network rules.
 */
export function isOnAllowedNetwork(
  ip: string,
  networks: Array<{ ipOrCidr: string }>
): boolean {
  if (!networks.length) return false;
  return networks.some((n) => matchesCidr(ip, n.ipOrCidr));
}

// ---------------------------------------------------------------------------
// Source IP extraction helper (used in routes, exported for testability)
// ---------------------------------------------------------------------------

import type { Request } from "express";

/**
 * Extracts the real client IP from an Express request.
 * Reads X-Forwarded-For (first hop) with fallback to socket.remoteAddress.
 */
export function extractSourceIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

// ---------------------------------------------------------------------------
// Core status resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the guest's current tracking status from available evidence.
 *
 * Decision tree:
 *   1. Tracking disabled or no location data → UNKNOWN
 *   2. Location outside geofence → OUTSIDE_HOTEL
 *   3. Inside geofence + source IP on hotel network → IN_HOTEL_AND_ON_WIFI
 *   4. Inside geofence + source IP NOT on hotel network → IN_HOTEL_NOT_ON_WIFI
 */
export function resolveTrackingStatus(params: ResolveStatusParams): TrackingStatus {
  const { config, networks, lat, lng, sourceIp } = params;

  if (!config.isEnabled) return "UNKNOWN";
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return "UNKNOWN";

  if (!isInGeofence(lat, lng, config)) return "OUTSIDE_HOTEL";

  return isOnAllowedNetwork(sourceIp, networks)
    ? "IN_HOTEL_AND_ON_WIFI"
    : "IN_HOTEL_NOT_ON_WIFI";
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function isValidLatitude(v: unknown): v is number {
  return typeof v === "number" && isFinite(v) && v >= -90 && v <= 90;
}

export function isValidLongitude(v: unknown): v is number {
  return typeof v === "number" && isFinite(v) && v >= -180 && v <= 180;
}

export function isValidRadius(v: unknown): v is number {
  return typeof v === "number" && isFinite(v) && v >= 10 && v <= 50_000;
}

/** Basic sanity check for a single IP address (v4 only). */
export function isValidIp(ip: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim());
}

/** Basic sanity check for a CIDR range string (e.g. 192.168.1.0/24). */
export function isValidCidr(cidr: string): boolean {
  const [ip, prefix] = cidr.trim().split("/");
  if (!ip || !prefix) return false;
  const p = parseInt(prefix, 10);
  return isValidIp(ip) && !isNaN(p) && p >= 0 && p <= 32;
}

/** Returns true if the string is a valid IP address or CIDR range. */
export function isValidIpOrCidr(value: string): boolean {
  const trimmed = value.trim();
  return isValidCidr(trimmed) || isValidIp(trimmed);
}
