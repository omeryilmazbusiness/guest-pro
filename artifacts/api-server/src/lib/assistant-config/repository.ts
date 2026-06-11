import { db, hotelAssistantConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { defaultAmenities, mergeAmenities } from "./defaults";
import type { HotelAssistantConfigDto, HotelAmenityConfig } from "./types";

function mapRow(row: typeof hotelAssistantConfigsTable.$inferSelect): HotelAssistantConfigDto {
  return {
    hotelId: row.hotelId,
    aboutHotel: row.aboutHotel ?? "",
    cityName: row.cityName,
    countryCode: row.countryCode ?? null,
    amenities: mergeAmenities(row.amenities),
    taxiLobbyPhone: row.taxiLobbyPhone,
    taxiNotes: row.taxiNotes,
    spaPhone: row.spaPhone,
    spaInfo: row.spaInfo,
    spaOpenTime: row.spaOpenTime,
    spaCloseTime: row.spaCloseTime,
    salonInfo: row.salonInfo,
    salonPhone: row.salonPhone,
    salonOpenTime: row.salonOpenTime,
    salonCloseTime: row.salonCloseTime,
    laundryInfo: row.laundryInfo,
    laundryPhone: row.laundryPhone,
    onboardingCompletedAt: row.onboardingCompletedAt?.toISOString() ?? null,
  };
}

export class HotelAssistantConfigRepository {
  async ensureConfig(hotelId: number): Promise<void> {
    const [existing] = await db
      .select({ id: hotelAssistantConfigsTable.id })
      .from(hotelAssistantConfigsTable)
      .where(eq(hotelAssistantConfigsTable.hotelId, hotelId));
    if (existing) return;
    await db.insert(hotelAssistantConfigsTable).values({
      hotelId,
      amenities: defaultAmenities(),
    });
  }

  async getConfig(hotelId: number): Promise<HotelAssistantConfigDto | null> {
    const [row] = await db
      .select()
      .from(hotelAssistantConfigsTable)
      .where(eq(hotelAssistantConfigsTable.hotelId, hotelId));
    if (!row) return null;
    return mapRow(row);
  }

  async getOrCreate(hotelId: number): Promise<HotelAssistantConfigDto> {
    await this.ensureConfig(hotelId);
    const config = await this.getConfig(hotelId);
    if (!config) throw new Error("Failed to load assistant config");
    return config;
  }

  async upsertConfig(
    hotelId: number,
    patch: Partial<Omit<HotelAssistantConfigDto, "hotelId">>,
  ): Promise<HotelAssistantConfigDto> {
    await this.ensureConfig(hotelId);
    const values: Record<string, unknown> = {};
    if (patch.aboutHotel !== undefined) values.aboutHotel = patch.aboutHotel.slice(0, 4000);
    if (patch.cityName !== undefined) values.cityName = patch.cityName?.trim() || null;
    if (patch.countryCode !== undefined) {
      values.countryCode = patch.countryCode?.trim().toUpperCase() || null;
    }
    if (patch.amenities !== undefined) values.amenities = mergeAmenities(patch.amenities);
    if (patch.taxiLobbyPhone !== undefined) values.taxiLobbyPhone = patch.taxiLobbyPhone?.trim() || null;
    if (patch.taxiNotes !== undefined) values.taxiNotes = patch.taxiNotes?.trim() || null;
    if (patch.spaPhone !== undefined) values.spaPhone = patch.spaPhone?.trim() || null;
    if (patch.spaInfo !== undefined) values.spaInfo = patch.spaInfo?.trim() || null;
    if (patch.spaOpenTime !== undefined) values.spaOpenTime = patch.spaOpenTime?.trim() || null;
    if (patch.spaCloseTime !== undefined) values.spaCloseTime = patch.spaCloseTime?.trim() || null;
    if (patch.salonInfo !== undefined) values.salonInfo = patch.salonInfo?.trim() || null;
    if (patch.salonPhone !== undefined) values.salonPhone = patch.salonPhone?.trim() || null;
    if (patch.salonOpenTime !== undefined) values.salonOpenTime = patch.salonOpenTime?.trim() || null;
    if (patch.salonCloseTime !== undefined) values.salonCloseTime = patch.salonCloseTime?.trim() || null;
    if (patch.laundryInfo !== undefined) values.laundryInfo = patch.laundryInfo?.trim() || null;
    if (patch.laundryPhone !== undefined) values.laundryPhone = patch.laundryPhone?.trim() || null;
    if (patch.onboardingCompletedAt !== undefined) {
      values.onboardingCompletedAt = patch.onboardingCompletedAt
        ? new Date(patch.onboardingCompletedAt)
        : null;
    }

    const [row] = await db
      .update(hotelAssistantConfigsTable)
      .set(values)
      .where(eq(hotelAssistantConfigsTable.hotelId, hotelId))
      .returning();
    if (!row) throw new Error("Assistant config update failed");
    return mapRow(row);
  }
}

export const hotelAssistantConfigRepository = new HotelAssistantConfigRepository();

export type { HotelAmenityConfig };
