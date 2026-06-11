import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireGeneralManager } from "../middlewares/requireAuth";
import { buildHotelSetupSteps, computeHotelSetupCompletion } from "../lib/hotel-setup/completion";
import { dismissHotelSetupWizard, loadHotelSetupContext } from "../lib/hotel-setup/load-context";

const router: IRouter = Router();

const dismissBodySchema = z.object({
  dismiss: z.literal(true),
});

/** GET /hotel/setup-wizard — GM onboarding progress (4 steps) */
router.get("/hotel/setup-wizard", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId!;
  const ctx = await loadHotelSetupContext(hotelId);
  const completion = computeHotelSetupCompletion(ctx);
  const steps = buildHotelSetupSteps(ctx);

  res.json({
    steps,
    completion,
    dismissed: ctx.dismissed,
  });
});

/** POST /hotel/setup-wizard/dismiss — hide wizard after 100% celebration */
router.post("/hotel/setup-wizard/dismiss", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId!;
  const parsed = dismissBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  await dismissHotelSetupWizard(hotelId);
  const ctx = await loadHotelSetupContext(hotelId);
  res.json({
    steps: buildHotelSetupSteps(ctx),
    completion: computeHotelSetupCompletion(ctx),
    dismissed: true,
  });
});

export default router;
