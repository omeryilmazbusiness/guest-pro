import type { ServiceRequest } from "@/lib/service-requests";

export type FulfillmentPhase = "received" | "kitchen" | "en_route" | "delivered";

const KITCHEN_TO_EN_ROUTE_MS = 8 * 60_000;

export function resolveFulfillmentPhase(request: ServiceRequest): FulfillmentPhase {
  if (request.status === "resolved") return "delivered";
  if (request.status === "open") return "received";

  const stage = (request.structuredData as { fulfillmentStage?: string } | null)?.fulfillmentStage;
  if (stage === "en_route") return "en_route";
  if (stage === "kitchen") return "kitchen";

  if (request.requestType === "FOOD_ORDER") {
    const elapsed = Date.now() - new Date(request.updatedAt).getTime();
    return elapsed >= KITCHEN_TO_EN_ROUTE_MS ? "en_route" : "kitchen";
  }

  return "kitchen";
}

/** Rough ETA in minutes for preparing food orders. */
export function estimateEtaMinutes(request: ServiceRequest, phase: FulfillmentPhase): number | null {
  if (phase === "delivered" || phase === "received") return null;

  if (phase === "kitchen") {
    const minsSinceCreated = Math.floor(
      (Date.now() - new Date(request.createdAt).getTime()) / 60_000,
    );
    return Math.max(5, 18 - minsSinceCreated);
  }

  if (phase === "en_route") {
    const minsSinceUpdate = Math.floor(
      (Date.now() - new Date(request.updatedAt).getTime()) / 60_000,
    );
    return Math.max(2, 10 - minsSinceUpdate);
  }

  return null;
}

export function isFoodOrder(request: ServiceRequest): boolean {
  return request.requestType === "FOOD_ORDER";
}
