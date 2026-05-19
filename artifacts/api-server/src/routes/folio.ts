import { Router, type IRouter } from "express";
import { requireGuest } from "../middlewares/requireAuth";
import { getDailyBillForGuest, listFolioDaySummaries } from "../lib/folio";

const router: IRouter = Router();

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00.000Z`));
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /folio/daily?date=YYYY-MM-DD
router.get("/folio/daily", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;
  const raw = typeof req.query.date === "string" ? req.query.date : todayUtc();
  const date = isValidDate(raw) ? raw : todayUtc();

  const bill = await getDailyBillForGuest(guestId, date);
  res.json(bill);
});

// GET /folio/days?limit=14
router.get("/folio/days", requireGuest, async (req, res): Promise<void> => {
  const guestId = req.session!.guestId!;
  const limit = Math.min(30, Math.max(1, parseInt(String(req.query.limit ?? "14"), 10) || 14));

  const days = await listFolioDaySummaries(guestId, limit);
  res.json({ days });
});

export default router;
