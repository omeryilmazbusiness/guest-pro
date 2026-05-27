import crypto from "crypto";
import {
  db,
  hotelsTable,
  hotelBrandingTable,
  usersTable,
  guestsTable,
  guestKeysTable,
  guestQrTokensTable,
  chatSessionsTable,
  messagesTable,
  quickActionsTable,
  welcomeAlertsTable,
  serviceRequestsTable,
  auditLogsTable,
  dailyUsageTable,
  dailySummariesTable,
  hotelTrackingConfigsTable,
  hotelTrackingNetworksTable,
  guestPresenceSnapshotsTable,
  guestFolioEntriesTable,
  staffTasksTable,
  restaurantMenuItemsTable,
  restaurantStockItemsTable,
  restaurantCareInsightsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "./auth";
import { isReservedHotelSlug, slugifyHotelName } from "./reserved-slugs";

export class ProvisioningError extends Error {
  constructor(
    message: string,
    readonly code:
      | "SLUG_RESERVED"
      | "SLUG_TAKEN"
      | "EMAIL_TAKEN"
      | "HOTEL_NOT_FOUND"
      | "VALIDATION"
      | "HAS_DEPENDENCIES",
  ) {
    super(message);
    this.name = "ProvisioningError";
  }
}

export interface CreateHotelInput {
  name: string;
  slug?: string;
  appName?: string;
  address?: string;
  countryCode?: string;
}

export interface CreateHotelManagerInput {
  hotelId: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function createHotelWithBranding(input: CreateHotelInput) {
  /** Slug is always derived from the hotel name on first creation (not client-editable). */
  const slug = slugifyHotelName(input.name).toLowerCase();
  if (!slug || slug.length < 2) {
    throw new ProvisioningError("Hotel slug must be at least 2 characters.", "VALIDATION");
  }
  if (isReservedHotelSlug(slug)) {
    throw new ProvisioningError(`Slug "${slug}" is reserved.`, "SLUG_RESERVED");
  }

  const [existing] = await db.select({ id: hotelsTable.id }).from(hotelsTable).where(eq(hotelsTable.slug, slug));
  if (existing) {
    throw new ProvisioningError(`Slug "${slug}" is already in use.`, "SLUG_TAKEN");
  }

  const countryCode = input.countryCode?.trim().toUpperCase().slice(0, 2) || null;
  const address = input.address?.trim() || null;

  const [hotel] = await db
    .insert(hotelsTable)
    .values({
      name: input.name.trim(),
      slug,
      address,
      countryCode,
      isActive: true,
    })
    .returning();

  await db.insert(hotelBrandingTable).values({
    hotelId: hotel.id,
    appName: input.appName?.trim() || input.name.trim(),
  });

  return hotel;
}

export async function createHotelGeneralManager(input: CreateHotelManagerInput) {
  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, input.hotelId));
  if (!hotel) {
    throw new ProvisioningError("Hotel not found.", "HOTEL_NOT_FOUND");
  }

  const email = input.email.toLowerCase().trim();
  const [existingUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existingUser) {
    throw new ProvisioningError("A user with this email already exists.", "EMAIL_TAKEN");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const [manager] = await db
    .insert(usersTable)
    .values({
      hotelId: hotel.id,
      email,
      passwordHash: hashPassword(input.password, salt),
      provider: "local",
      role: "manager",
      staffDepartment: null,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      isActive: true,
    })
    .returning();

  return { hotel, manager };
}

export const HOTEL_PLAN_TIERS = ["starter", "growth", "enterprise"] as const;
export type HotelPlanTier = (typeof HOTEL_PLAN_TIERS)[number];

export interface UpdateHotelInput {
  name?: string;
  address?: string | null;
  countryCode?: string;
  slug?: string;
  isActive?: boolean;
  planTier?: HotelPlanTier;
  subscriptionRenewsAt?: string | null;
  platformNotes?: string | null;
}

export async function updateHotelRecord(hotelId: number, input: UpdateHotelInput) {
  const [existing] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  if (!existing) {
    throw new ProvisioningError("Hotel not found.", "HOTEL_NOT_FOUND");
  }

  const patch: Partial<typeof hotelsTable.$inferInsert> = {};

  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.address !== undefined) {
    patch.address =
      input.address === null ? null : input.address.trim() || null;
  }
  if (input.countryCode !== undefined) {
    patch.countryCode = input.countryCode.trim().toUpperCase().slice(0, 2) || null;
  }
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.planTier !== undefined) {
    const tier = input.planTier.trim().toLowerCase();
    if (!(HOTEL_PLAN_TIERS as readonly string[]).includes(tier)) {
      throw new ProvisioningError("Invalid plan tier.", "VALIDATION");
    }
    patch.planTier = tier;
  }
  if (input.subscriptionRenewsAt !== undefined) {
    patch.subscriptionRenewsAt =
      input.subscriptionRenewsAt === null || input.subscriptionRenewsAt === ""
        ? null
        : new Date(input.subscriptionRenewsAt);
  }
  if (input.platformNotes !== undefined) {
    patch.platformNotes = input.platformNotes?.trim() || null;
  }

  if (input.slug !== undefined) {
    const slug = input.slug.trim().toLowerCase();
    if (slug.length < 2) {
      throw new ProvisioningError("Hotel slug must be at least 2 characters.", "VALIDATION");
    }
    if (isReservedHotelSlug(slug)) {
      throw new ProvisioningError(`Slug "${slug}" is reserved.`, "SLUG_RESERVED");
    }
    if (slug !== existing.slug) {
      const [taken] = await db
        .select({ id: hotelsTable.id })
        .from(hotelsTable)
        .where(eq(hotelsTable.slug, slug));
      if (taken) {
        throw new ProvisioningError(`Slug "${slug}" is already in use.`, "SLUG_TAKEN");
      }
      patch.slug = slug;
    }
  }

  if (Object.keys(patch).length === 0) return existing;

  const [updated] = await db
    .update(hotelsTable)
    .set(patch)
    .where(eq(hotelsTable.id, hotelId))
    .returning();

  return updated!;
}

export async function deleteHotelPermanently(hotelId: number, confirmSlug: string) {
  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  if (!hotel) {
    throw new ProvisioningError("Hotel not found.", "HOTEL_NOT_FOUND");
  }
  if (confirmSlug.trim().toLowerCase() !== hotel.slug) {
    throw new ProvisioningError('Type the hotel slug exactly to confirm deletion.', "VALIDATION");
  }

  const { deleteHotelLogoFile } = await import("./hotel-logo-storage");
  await deleteHotelLogoFile(hotelId);

  await db.transaction(async (tx) => {
    const sessionRows = await tx
      .select({ id: chatSessionsTable.id })
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.hotelId, hotelId));
    const sessionIds = sessionRows.map((r) => r.id);
    if (sessionIds.length) {
      await tx.delete(messagesTable).where(inArray(messagesTable.sessionId, sessionIds));
    }

    await tx.delete(guestFolioEntriesTable).where(eq(guestFolioEntriesTable.hotelId, hotelId));
    await tx.delete(serviceRequestsTable).where(eq(serviceRequestsTable.hotelId, hotelId));
    await tx.delete(chatSessionsTable).where(eq(chatSessionsTable.hotelId, hotelId));

    const guestRows = await tx
      .select({ id: guestsTable.id })
      .from(guestsTable)
      .where(eq(guestsTable.hotelId, hotelId));
    const guestIds = guestRows.map((r) => r.id);
    if (guestIds.length) {
      await tx.delete(dailyUsageTable).where(inArray(dailyUsageTable.guestId, guestIds));
    }

    await tx.delete(guestQrTokensTable).where(eq(guestQrTokensTable.hotelId, hotelId));
    await tx.delete(guestKeysTable).where(eq(guestKeysTable.hotelId, hotelId));
    await tx.delete(guestPresenceSnapshotsTable).where(eq(guestPresenceSnapshotsTable.hotelId, hotelId));
    await tx.delete(guestsTable).where(eq(guestsTable.hotelId, hotelId));
    await tx.delete(welcomeAlertsTable).where(eq(welcomeAlertsTable.hotelId, hotelId));
    await tx.delete(quickActionsTable).where(eq(quickActionsTable.hotelId, hotelId));
    await tx.delete(staffTasksTable).where(eq(staffTasksTable.hotelId, hotelId));
    await tx.delete(restaurantCareInsightsTable).where(eq(restaurantCareInsightsTable.hotelId, hotelId));
    await tx.delete(restaurantStockItemsTable).where(eq(restaurantStockItemsTable.hotelId, hotelId));
    await tx.delete(restaurantMenuItemsTable).where(eq(restaurantMenuItemsTable.hotelId, hotelId));
    await tx.delete(hotelTrackingNetworksTable).where(eq(hotelTrackingNetworksTable.hotelId, hotelId));
    await tx.delete(hotelTrackingConfigsTable).where(eq(hotelTrackingConfigsTable.hotelId, hotelId));
    await tx.delete(dailySummariesTable).where(eq(dailySummariesTable.hotelId, hotelId));
    await tx.delete(auditLogsTable).where(eq(auditLogsTable.hotelId, hotelId));
    await tx.delete(usersTable).where(eq(usersTable.hotelId, hotelId));
    await tx.delete(hotelBrandingTable).where(eq(hotelBrandingTable.hotelId, hotelId));
    await tx.delete(hotelsTable).where(eq(hotelsTable.id, hotelId));
  });

  return { deleted: true, slug: hotel.slug };
}
