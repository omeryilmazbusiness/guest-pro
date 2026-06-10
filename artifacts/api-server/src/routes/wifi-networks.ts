/**
 * Hotel Wi-Fi network routes — GM manages networks; guests see assigned network.
 *
 * GET  /hotel/wifi-networks   requireGuestOperations — list networks (for assignment)
 * PUT  /hotel/wifi-networks   requireGeneralManager — replace all networks
 * GET  /guest/wifi            requireGuest — Wi-Fi assigned to this guest
 */

import { Router } from "express";
import type { IRouter } from "express";
import { z } from "zod";
import { db, hotelWifiNetworksTable, guestsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { requireGeneralManager, requireGuest, requireGuestOperations } from "../middlewares/requireAuth";

const router: IRouter = Router();

const networkEntrySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
  sortOrder: z.number().int().optional(),
});

const replaceNetworksSchema = z.object({
  networks: z.array(networkEntrySchema).max(50),
});

router.get("/hotel/wifi-networks", requireGuestOperations, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const rows = await db
    .select()
    .from(hotelWifiNetworksTable)
    .where(eq(hotelWifiNetworksTable.hotelId, hotelId))
    .orderBy(asc(hotelWifiNetworksTable.sortOrder), asc(hotelWifiNetworksTable.name));
  res.json({ networks: rows });
});

router.put("/hotel/wifi-networks", requireGeneralManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const parsed = replaceNetworksSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const normalized = parsed.data.networks.map((n, i) => ({
    id: n.id,
    hotelId,
    name: n.name.trim(),
    wifiPassword: n.password,
    sortOrder: n.sortOrder ?? i,
  }));

  const names = new Set(normalized.map((n) => n.name.toLowerCase()));
  if (names.size !== normalized.length) {
    res.status(400).json({ error: "Duplicate network names are not allowed" });
    return;
  }

  const existing = await db
    .select({ id: hotelWifiNetworksTable.id })
    .from(hotelWifiNetworksTable)
    .where(eq(hotelWifiNetworksTable.hotelId, hotelId));

  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set<number>();

  for (const network of normalized) {
    if (network.id && existingIds.has(network.id)) {
      await db
        .update(hotelWifiNetworksTable)
        .set({
          name: network.name,
          wifiPassword: network.wifiPassword,
          sortOrder: network.sortOrder,
        })
        .where(
          and(
            eq(hotelWifiNetworksTable.id, network.id),
            eq(hotelWifiNetworksTable.hotelId, hotelId),
          ),
        );
      keptIds.add(network.id);
      continue;
    }

    const [inserted] = await db
      .insert(hotelWifiNetworksTable)
      .values({
        hotelId: network.hotelId,
        name: network.name,
        wifiPassword: network.wifiPassword,
        sortOrder: network.sortOrder,
      })
      .returning({ id: hotelWifiNetworksTable.id });
    keptIds.add(inserted.id);
  }

  const removeIds = [...existingIds].filter((id) => !keptIds.has(id));
  if (removeIds.length > 0) {
    for (const id of removeIds) {
      await db
        .delete(hotelWifiNetworksTable)
        .where(and(eq(hotelWifiNetworksTable.id, id), eq(hotelWifiNetworksTable.hotelId, hotelId)));
    }
  }

  const rows = await db
    .select()
    .from(hotelWifiNetworksTable)
    .where(eq(hotelWifiNetworksTable.hotelId, hotelId))
    .orderBy(asc(hotelWifiNetworksTable.sortOrder), asc(hotelWifiNetworksTable.name));

  res.json({ networks: rows });
});

router.get("/guest/wifi", requireGuest, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const guestId = req.session!.guestId;

  const [guest] = await db
    .select({ wifiNetworkId: guestsTable.wifiNetworkId })
    .from(guestsTable)
    .where(and(eq(guestsTable.id, guestId!), eq(guestsTable.hotelId, hotelId)));

  if (!guest?.wifiNetworkId) {
    res.json({ configured: false });
    return;
  }

  const [network] = await db
    .select()
    .from(hotelWifiNetworksTable)
    .where(
      and(
        eq(hotelWifiNetworksTable.id, guest.wifiNetworkId),
        eq(hotelWifiNetworksTable.hotelId, hotelId),
      ),
    );

  if (!network) {
    res.json({ configured: false });
    return;
  }

  res.json({
    configured: true,
    name: network.name,
    wifiPassword: network.wifiPassword,
  });
});

export default router;
