import {
  db,
  hotelsTable,
  hotelBrandingTable,
  usersTable,
  guestsTable,
  auditLogsTable,
} from "@workspace/db";
import { eq, desc, sql, max, and } from "drizzle-orm";
import { resolveHotelLogoUrl } from "./hotel-logo-storage";

export async function listHotelsWithTrackStats() {
  const hotels = await db
    .select({
      id: hotelsTable.id,
      name: hotelsTable.name,
      slug: hotelsTable.slug,
      address: hotelsTable.address,
      countryCode: hotelsTable.countryCode,
      isActive: hotelsTable.isActive,
      planTier: hotelsTable.planTier,
      subscriptionRenewsAt: hotelsTable.subscriptionRenewsAt,
      platformNotes: hotelsTable.platformNotes,
      createdAt: hotelsTable.createdAt,
      updatedAt: hotelsTable.updatedAt,
      logoUrl: hotelBrandingTable.logoUrl,
    })
    .from(hotelsTable)
    .leftJoin(hotelBrandingTable, eq(hotelBrandingTable.hotelId, hotelsTable.id))
    .orderBy(desc(hotelsTable.createdAt));

  const statsRows = await db
    .select({
      hotelId: hotelsTable.id,
      managerCount: sql<number>`count(distinct case when ${usersTable.role} = 'manager' then ${usersTable.id} end)::int`,
      staffCount: sql<number>`count(distinct ${usersTable.id})::int`,
      guestCount: sql<number>`count(distinct case when ${guestsTable.isActive} = true then ${guestsTable.id} end)::int`,
      totalGuests: sql<number>`count(distinct ${guestsTable.id})::int`,
    })
    .from(hotelsTable)
    .leftJoin(usersTable, eq(usersTable.hotelId, hotelsTable.id))
    .leftJoin(guestsTable, eq(guestsTable.hotelId, hotelsTable.id))
    .groupBy(hotelsTable.id);

  const lastActivityRows = await db
    .select({
      hotelId: auditLogsTable.hotelId,
      lastAt: max(auditLogsTable.createdAt),
    })
    .from(auditLogsTable)
    .where(sql`${auditLogsTable.hotelId} is not null`)
    .groupBy(auditLogsTable.hotelId);

  const gmRows = await db
    .select({
      hotelId: usersTable.hotelId,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "manager"));

  const statsByHotel = new Map(statsRows.map((r) => [r.hotelId, r]));
  const activityByHotel = new Map(
    lastActivityRows.filter((r) => r.hotelId != null).map((r) => [r.hotelId!, r.lastAt]),
  );
  const gmByHotel = new Map(gmRows.map((r) => [r.hotelId, r]));

  return Promise.all(
    hotels.map(async (h) => {
    const stats = statsByHotel.get(h.id);
    const gm = gmByHotel.get(h.id);
    const logoUrl = await resolveHotelLogoUrl(h.id, h.slug, h.logoUrl);
    return {
      ...h,
      logoUrl,
      managerCount: stats?.managerCount ?? 0,
      staffCount: stats?.staffCount ?? 0,
      activeGuestCount: stats?.guestCount ?? 0,
      totalGuestCount: stats?.totalGuests ?? 0,
      lastActivityAt: activityByHotel.get(h.id) ?? null,
      generalManager: gm
        ? {
            email: gm.email,
            name: [gm.firstName, gm.lastName].filter(Boolean).join(" ") || null,
          }
        : null,
    };
  }),
  );
}
