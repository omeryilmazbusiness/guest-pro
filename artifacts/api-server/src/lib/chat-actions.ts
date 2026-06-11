/**
 * Chat actions — request creation and confirmation helpers.
 */

import { db, serviceRequestsTable } from "@workspace/db";
import { syncFolioFromServiceRequest } from "./folio";
import { logger } from "./logger";
import type { GuestChatContext } from "./chat-context";

export type {
  ChatIntent,
  ChatActionRequestType,
  SuggestedChatAction,
} from "./chat-action-parse";

export {
  stripActionMarkup,
  stripAiMarkup,
  stripRoadmapMarkup,
  isRoadmapRequest,
  parseAiResponse,
  normalizeSuggestedAction,
  actionToCategory,
  serializePendingAction,
  parsePendingFromCategory,
  serializeReplyOptionsMeta,
  serializeAssistantExtrasMeta,
  parseReplyOptionsFromMeta,
  parseAssistantExtrasFromMeta,
  normalizeReplyOptions,
  type ChatRoadmap,
  type ChatRoadmapStop,
} from "./chat-action-parse";

import { normalizeSuggestedAction, type SuggestedChatAction } from "./chat-action-parse";

const CONFIRM_RE =
  /^(evet|yes|yeah|yep|ok|okay|tamam|onay|onaylıyorum|onayliyorum|confirm|confirmed|do it|go ahead|lütfen|olur|sure|please|yap|gönder|gonder)\b/i;

export function isConfirmationUtterance(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length > 48) return false;
  return CONFIRM_RE.test(t);
}

export function confirmationMessage(firstName: string, lang?: string): string {
  const name = firstName ? `${firstName}, ` : "";
  const l = (lang ?? "en").toLowerCase();
  if (l.startsWith("tr")) {
    return `${name}talebinizi aldık. Ekibimiz kısa sürede odanıza ilgilenecek.`;
  }
  if (l.startsWith("ar")) {
    return `${name}تم استلام طلبك. سيتولى فريقنا الأمر قريبًا.`;
  }
  if (l.startsWith("de")) {
    return `${name}Ihre Anfrage wurde aufgenommen. Unser Team kümmert sich in Kürze darum.`;
  }
  if (l.startsWith("fr")) {
    return `${name}votre demande a été enregistrée. Notre équipe s'en occupe rapidement.`;
  }
  if (l.startsWith("es")) {
    return `${name}hemos recibido su solicitud. Nuestro equipo atenderá pronto.`;
  }
  if (l.startsWith("ru")) {
    return `${name}ваш запрос принят. Наша команда скоро займётся этим.`;
  }
  return `${name}your request is in. Our team will take care of it shortly.`;
}

export async function createRequestFromAction(
  ctx: GuestChatContext,
  action: SuggestedChatAction,
  sessionId: number,
): Promise<{ requestId: number }> {
  const normalized = normalizeSuggestedAction(action);
  if (!normalized?.requestType || !normalized.summary?.trim()) {
    throw new Error("Invalid action for request creation");
  }

  const [request] = await db
    .insert(serviceRequestsTable)
    .values({
      guestId: ctx.guestId,
      hotelId: ctx.hotelId,
      roomNumber: ctx.roomNumber,
      requestType: normalized.requestType,
      summary: normalized.summary.trim().slice(0, 500),
      structuredData: {
        ...(normalized.structuredData ?? {}),
        source: "ai_chat",
        chatSessionId: sessionId,
        intent: normalized.intent,
        urgency: normalized.urgency ?? "normal",
      },
      sourceSessionId: sessionId,
      guestFirstName: ctx.firstName,
      guestLastName: ctx.lastName,
      status: "open",
    })
    .returning();

  try {
    await syncFolioFromServiceRequest(request);
  } catch (err) {
    logger.error({ err, requestId: request.id }, "Folio sync after chat request");
  }

  return { requestId: request.id };
}
