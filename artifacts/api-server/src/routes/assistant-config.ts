import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireGeneralManager } from "../middlewares/requireAuth";
import { hotelAssistantConfigRepository } from "../lib/assistant-config/repository";
import {
  buildOnboardingSteps,
  computeAssistantCompletion,
} from "../lib/assistant-config/completion";
import { AMENITY_CATALOG } from "../lib/assistant-config/defaults";
import type { HotelAssistantConfigDto } from "../lib/assistant-config/types";

const router: IRouter = Router();

const amenitySchema = z.object({
  id: z.string().min(1).max(40),
  enabled: z.boolean(),
  openTime: z.string().max(20).optional().nullable(),
  closeTime: z.string().max(20).optional().nullable(),
  reservationPhone: z.string().max(40).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const updateBodySchema = z.object({
  aboutHotel: z.string().max(4000).optional(),
  cityName: z.string().max(120).optional().nullable(),
  countryCode: z.string().max(4).optional().nullable(),
  amenities: z.array(amenitySchema).optional(),
  taxiLobbyPhone: z.string().max(40).optional().nullable(),
  taxiNotes: z.string().max(500).optional().nullable(),
  spaPhone: z.string().max(40).optional().nullable(),
  spaInfo: z.string().max(1000).optional().nullable(),
  spaOpenTime: z.string().max(20).optional().nullable(),
  spaCloseTime: z.string().max(20).optional().nullable(),
  salonInfo: z.string().max(1000).optional().nullable(),
  salonPhone: z.string().max(40).optional().nullable(),
  salonOpenTime: z.string().max(20).optional().nullable(),
  salonCloseTime: z.string().max(20).optional().nullable(),
  laundryInfo: z.string().max(1000).optional().nullable(),
  laundryPhone: z.string().max(40).optional().nullable(),
  dismissOnboarding: z.boolean().optional(),
});

type UpdateBody = z.infer<typeof updateBodySchema>;

function toConfigPatch(
  patch: Omit<UpdateBody, "dismissOnboarding">,
): Partial<Omit<HotelAssistantConfigDto, "hotelId">> {
  const { amenities, ...rest } = patch;
  return {
    ...rest,
    ...(amenities !== undefined
      ? {
          amenities: amenities.map((a) => ({
            id: a.id,
            enabled: a.enabled,
            openTime: a.openTime ?? undefined,
            closeTime: a.closeTime ?? undefined,
            reservationPhone: a.reservationPhone ?? undefined,
            notes: a.notes ?? undefined,
          })),
        }
      : {}),
  };
}

/** GET /hotel/assistant-config — GM assistant setup + completion */
router.get("/hotel/assistant-config", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId!;
  const config = await hotelAssistantConfigRepository.getOrCreate(hotelId);
  const completion = computeAssistantCompletion(config);
  const steps = buildOnboardingSteps(config);

  res.json({
    config,
    completion,
    steps,
    amenityCatalog: AMENITY_CATALOG,
  });
});

/** PUT /hotel/assistant-config — save GM assistant knowledge */
router.put("/hotel/assistant-config", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId!;
  const parsed = updateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { dismissOnboarding, ...patch } = parsed.data;
  const config = await hotelAssistantConfigRepository.upsertConfig(hotelId, toConfigPatch(patch));

  let updated = config;
  if (dismissOnboarding) {
    updated = await hotelAssistantConfigRepository.upsertConfig(hotelId, {
      onboardingCompletedAt: new Date().toISOString(),
    });
  }

  const finalCompletion = computeAssistantCompletion(updated);
  res.json({
    config: updated,
    completion: finalCompletion,
    steps: buildOnboardingSteps(updated),
    amenityCatalog: AMENITY_CATALOG,
  });
});

export default router;
