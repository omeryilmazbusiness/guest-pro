import { db, hotelNearbyPlacesTable, hotelWifiNetworksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hotelAssistantConfigRepository } from "../assistant-config/repository";
import type { HotelSetupContext } from "./types";

export async function loadHotelSetupContext(hotelId: number): Promise<HotelSetupContext> {
  const config = await hotelAssistantConfigRepository.getOrCreate(hotelId);

  const [wifiRows, placeRows] = await Promise.all([
    db
      .select({ id: hotelWifiNetworksTable.id })
      .from(hotelWifiNetworksTable)
      .where(eq(hotelWifiNetworksTable.hotelId, hotelId)),
    db
      .select({ id: hotelNearbyPlacesTable.id, isActive: hotelNearbyPlacesTable.isActive })
      .from(hotelNearbyPlacesTable)
      .where(eq(hotelNearbyPlacesTable.hotelId, hotelId)),
  ]);

  return {
    aboutHotel: config.aboutHotel,
    enabledAmenityCount: config.amenities.filter((a) => a.enabled).length,
    wifiNetworkCount: wifiRows.length,
    nearbyPlaceCount: placeRows.filter((p) => p.isActive !== false).length,
    dismissed: Boolean(config.onboardingCompletedAt),
  };
}

export async function dismissHotelSetupWizard(hotelId: number): Promise<void> {
  await hotelAssistantConfigRepository.upsertConfig(hotelId, {
    onboardingCompletedAt: new Date().toISOString(),
  });
}
