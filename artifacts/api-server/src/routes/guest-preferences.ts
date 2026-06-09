/**
 * Guest self-service preferences (authenticated guest only).
 *
 * PATCH /guest/language — update UI + voice locale for the current guest
 */

import { Router, type IRouter } from "express";
import { db, guestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireGuest } from "../middlewares/requireAuth";
import { voiceLocaleFromGuestUi, isGuestSelectableUiLocale } from "../lib/guest-ui-locale";

const router: IRouter = Router();

router.patch("/guest/language", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;
  const uiLocale = typeof req.body?.uiLocale === "string" ? req.body.uiLocale.trim().toLowerCase() : "";

  if (!isGuestSelectableUiLocale(uiLocale)) {
    res.status(400).json({ error: "uiLocale must be one of: en, tr, ar, ru" });
    return;
  }

  const voiceLocale = voiceLocaleFromGuestUi(uiLocale);

  const [updated] = await db
    .update(guestsTable)
    .set({ language: voiceLocale })
    .where(eq(guestsTable.id, guestId))
    .returning({ language: guestsTable.language });

  if (!updated) {
    res.status(404).json({ error: "Guest not found" });
    return;
  }

  res.json({ uiLocale, language: updated.language ?? voiceLocale });
});

export default router;
