/**
 * Resolve guest-visible quick-action chip labels from API category (not DB label text).
 */

import type { QuickAction } from "@workspace/api-client-react";
import type { GuestTranslations } from "@/lib/i18n";

export function getGuestQuickActionLabel(action: QuickAction, t: GuestTranslations): string {
  const cat = (action.category ?? "").toLowerCase();
  const icon = (action.icon ?? "").toLowerCase();

  if (cat.includes("reception") || icon === "phone") return t.receptionLiveTitle;
  if (cat.includes("activit")) return t.chatQuickActivity;
  if (cat.includes("food") || cat.includes("restaurant") || cat.includes("dining")) {
    return t.chatQuickFood;
  }
  if (cat.includes("support") || cat.includes("service")) return t.chatQuickSupport;

  const label = action.label.toLowerCase();
  if (/resepsiyon|reception/.test(label)) return t.receptionLiveTitle;
  if (/açık|hungry|food|yemek|طعام|جائع/.test(label)) return t.chatQuickFood;
  if (/destek|support|help|مساعدة/.test(label)) return t.chatQuickSupport;
  if (/aktivit|activit|bored|sıkıl/.test(label)) return t.chatQuickActivity;

  return action.label;
}
