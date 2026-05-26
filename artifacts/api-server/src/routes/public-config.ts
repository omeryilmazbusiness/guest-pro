import { Router } from "express";
import type { IRouter } from "express";
import { getDefaultHotelSlug } from "../lib/hotel-resolver";

const router: IRouter = Router();

/** GET /public/config — SPA bootstrap for legacy route redirects. */
router.get("/public/config", async (_req, res): Promise<void> => {
  const defaultHotelSlug = await getDefaultHotelSlug();
  res.json({ defaultHotelSlug });
});

export default router;
