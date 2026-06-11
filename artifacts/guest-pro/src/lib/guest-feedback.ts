import type { ServiceRequest } from "@/lib/service-requests";

export type GuestFeedbackKind = "guest_feedback" | "guest_complaint_suggestion";

export function getGuestFeedbackKind(
  request: ServiceRequest,
): GuestFeedbackKind | null {
  const kind = request.structuredData?.kind;
  if (kind === "guest_feedback" || kind === "guest_complaint_suggestion") {
    return kind;
  }
  return null;
}

export function isGuestFeedbackRequest(request: ServiceRequest): boolean {
  return getGuestFeedbackKind(request) != null;
}

export function getGuestFeedbackRating(request: ServiceRequest): number | null {
  if (getGuestFeedbackKind(request) !== "guest_feedback") return null;
  const rating = request.structuredData?.rating;
  return typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : null;
}

export function getGuestFeedbackComment(request: ServiceRequest): string | null {
  const kind = getGuestFeedbackKind(request);
  if (kind === "guest_feedback") {
    const comment = request.structuredData?.comment;
    return typeof comment === "string" && comment.trim() ? comment.trim() : null;
  }
  if (kind === "guest_complaint_suggestion") {
    const message = request.structuredData?.message;
    return typeof message === "string" && message.trim() ? message.trim() : null;
  }
  return null;
}
