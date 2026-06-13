/**
 * Remember Me entry-track service — guest prompt + 30s escalation to reception warning.
 */
import {
  db,
  guestEntryTrackSchedulesTable,
  guestPresenceSnapshotsTable,
  liveChatEmergencyEventsTable,
  liveChatSessionsTable,
} from "@workspace/db";
import { and, eq, isNull, desc } from "drizzle-orm";
import {
  isGuestInHotel,
  isRememberMeDue,
  rememberMeClientEventId,
  secondsUntilEscalation,
  shouldEscalateRememberMe,
} from "./entry-track-logic";
import { logger } from "./logger";

type ScheduleRow = typeof guestEntryTrackSchedulesTable.$inferSelect;

export interface RememberMePendingPrompt {
  scheduleId: number;
  expectedEntryAt: string;
  promptedAt: string;
  secondsUntilEscalation: number;
}

export interface RememberMeActiveSchedule {
  scheduleId: number;
  expectedEntryAt: string;
  /** 0–1 elapsed toward scheduled return time */
  progress: number;
  awaitingAck: boolean;
  secondsUntilEscalation: number | null;
}

async function loadGuestPresence(guestId: number) {
  const [presence] = await db
    .select()
    .from(guestPresenceSnapshotsTable)
    .where(eq(guestPresenceSnapshotsTable.guestId, guestId))
    .limit(1);
  return presence ?? null;
}

async function cancelSchedule(scheduleId: number, now: Date): Promise<void> {
  await db
    .update(guestEntryTrackSchedulesTable)
    .set({ cancelledAt: now, updatedAt: now })
    .where(eq(guestEntryTrackSchedulesTable.id, scheduleId));
}

async function resolveOrCreateSession(
  schedule: ScheduleRow,
  now: Date,
): Promise<number> {
  if (schedule.sessionId) return schedule.sessionId;

  const [existing] = await db
    .select({ id: liveChatSessionsTable.id })
    .from(liveChatSessionsTable)
    .where(
      and(
        eq(liveChatSessionsTable.guestId, schedule.guestId),
        eq(liveChatSessionsTable.hotelId, schedule.hotelId),
        eq(liveChatSessionsTable.status, "active"),
      ),
    )
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(liveChatSessionsTable)
    .values({
      guestId: schedule.guestId,
      hotelId: schedule.hotelId,
      status: "active",
      lastMessageAt: now,
    })
    .returning({ id: liveChatSessionsTable.id });

  return created!.id;
}

async function escalateRememberMeSchedule(
  schedule: ScheduleRow,
  now: Date,
): Promise<number | null> {
  if (schedule.alertTriggeredAt) return schedule.emergencyEventId;

  const sessionId = await resolveOrCreateSession(schedule, now);
  const clientEventId = rememberMeClientEventId(schedule.id);

  const [existing] = await db
    .select({ id: liveChatEmergencyEventsTable.id })
    .from(liveChatEmergencyEventsTable)
    .where(eq(liveChatEmergencyEventsTable.clientEventId, clientEventId))
    .limit(1);

  let eventId = existing?.id ?? null;

  if (!eventId) {
    const [event] = await db
      .insert(liveChatEmergencyEventsTable)
      .values({
        sessionId,
        hotelId: schedule.hotelId,
        guestId: schedule.guestId,
        clientEventId,
        severity: "warning",
      })
      .returning({ id: liveChatEmergencyEventsTable.id });
    eventId = event!.id;

    await db
      .update(liveChatSessionsTable)
      .set({
        emergencyAt: now,
        emergencyAcknowledgedAt: null,
        updatedAt: now,
      })
      .where(eq(liveChatSessionsTable.id, sessionId));
  }

  await db
    .update(guestEntryTrackSchedulesTable)
    .set({
      alertTriggeredAt: now,
      emergencyEventId: eventId,
      sessionId,
      updatedAt: now,
    })
    .where(eq(guestEntryTrackSchedulesTable.id, schedule.id));

  logger.info(
    { scheduleId: schedule.id, guestId: schedule.guestId, eventId },
    "remember me missed — warning sent to reception",
  );

  return eventId;
}

async function promptRememberMeSchedule(schedule: ScheduleRow, now: Date): Promise<void> {
  await db
    .update(guestEntryTrackSchedulesTable)
    .set({ guestPromptedAt: now, updatedAt: now })
    .where(eq(guestEntryTrackSchedulesTable.id, schedule.id));
}

/** Process one active schedule — cancel, prompt, or escalate as needed. */
export async function processRememberMeSchedule(
  schedule: ScheduleRow,
  now = new Date(),
): Promise<"cancelled" | "prompted" | "escalated" | "idle"> {
  if (schedule.cancelledAt || schedule.guestAcknowledgedAt || schedule.alertTriggeredAt) {
    return "idle";
  }

  const presence = await loadGuestPresence(schedule.guestId);
  if (isGuestInHotel(presence?.status)) {
    await cancelSchedule(schedule.id, now);
    return "cancelled";
  }

  if (!schedule.guestPromptedAt && isRememberMeDue(schedule.expectedEntryAt, now)) {
    await promptRememberMeSchedule(schedule, now);
    return "prompted";
  }

  if (
    schedule.guestPromptedAt &&
    !schedule.guestAcknowledgedAt &&
    shouldEscalateRememberMe(schedule.guestPromptedAt, now)
  ) {
    await escalateRememberMeSchedule(schedule, now);
    return "escalated";
  }

  return "idle";
}

export async function processDueEntryTrackSchedules(): Promise<number> {
  const now = new Date();

  const active = await db
    .select()
    .from(guestEntryTrackSchedulesTable)
    .where(
      and(
        isNull(guestEntryTrackSchedulesTable.cancelledAt),
        isNull(guestEntryTrackSchedulesTable.alertTriggeredAt),
        isNull(guestEntryTrackSchedulesTable.guestAcknowledgedAt),
      ),
    );

  let actions = 0;
  for (const schedule of active) {
    try {
      const result = await processRememberMeSchedule(schedule, now);
      if (result !== "idle") actions += 1;
    } catch (err) {
      logger.error({ err, scheduleId: schedule.id }, "remember me schedule failed");
    }
  }

  return actions;
}

async function findActiveScheduleForGuest(guestId: number, hotelId: number) {
  const [schedule] = await db
    .select()
    .from(guestEntryTrackSchedulesTable)
    .where(
      and(
        eq(guestEntryTrackSchedulesTable.guestId, guestId),
        eq(guestEntryTrackSchedulesTable.hotelId, hotelId),
        isNull(guestEntryTrackSchedulesTable.cancelledAt),
        isNull(guestEntryTrackSchedulesTable.alertTriggeredAt),
        isNull(guestEntryTrackSchedulesTable.guestAcknowledgedAt),
      ),
    )
    .orderBy(desc(guestEntryTrackSchedulesTable.expectedEntryAt))
    .limit(1);

  return schedule ?? null;
}

/** Guest poll — lazy prompt + return pending popup payload. */
export async function getRememberMePendingPrompt(
  guestId: number,
  hotelId: number,
): Promise<RememberMePendingPrompt | null> {
  const now = new Date();
  let schedule = await findActiveScheduleForGuest(guestId, hotelId);
  if (!schedule) return null;

  const result = await processRememberMeSchedule(schedule, now);
  if (result === "cancelled" || result === "escalated") return null;

  schedule = await findActiveScheduleForGuest(guestId, hotelId);
  if (!schedule?.guestPromptedAt) return null;

  return {
    scheduleId: schedule.id,
    expectedEntryAt: schedule.expectedEntryAt.toISOString(),
    promptedAt: schedule.guestPromptedAt.toISOString(),
    secondsUntilEscalation: secondsUntilEscalation(schedule.guestPromptedAt, now),
  };
}

export async function acknowledgeRememberMeSchedule(
  scheduleId: number,
  guestId: number,
  hotelId: number,
): Promise<boolean> {
  const now = new Date();
  const [schedule] = await db
    .select()
    .from(guestEntryTrackSchedulesTable)
    .where(
      and(
        eq(guestEntryTrackSchedulesTable.id, scheduleId),
        eq(guestEntryTrackSchedulesTable.guestId, guestId),
        eq(guestEntryTrackSchedulesTable.hotelId, hotelId),
        isNull(guestEntryTrackSchedulesTable.cancelledAt),
        isNull(guestEntryTrackSchedulesTable.alertTriggeredAt),
      ),
    )
    .limit(1);

  if (!schedule) return false;

  await db
    .update(guestEntryTrackSchedulesTable)
    .set({
      guestAcknowledgedAt: now,
      cancelledAt: now,
      updatedAt: now,
    })
    .where(eq(guestEntryTrackSchedulesTable.id, scheduleId));

  return true;
}

/** Active Remember Me schedule for guest UI (icon arc progress). */
export async function getRememberMeActiveSchedule(
  guestId: number,
  hotelId: number,
): Promise<RememberMeActiveSchedule | null> {
  const now = new Date();
  const schedule = await findActiveScheduleForGuest(guestId, hotelId);
  if (!schedule) return null;

  const startMs = schedule.createdAt.getTime();
  const endMs = schedule.expectedEntryAt.getTime();
  const span = Math.max(endMs - startMs, 1);
  const progress = Math.min(1, Math.max(0, (now.getTime() - startMs) / span));

  return {
    scheduleId: schedule.id,
    expectedEntryAt: schedule.expectedEntryAt.toISOString(),
    progress,
    awaitingAck: !!schedule.guestPromptedAt,
    secondsUntilEscalation: schedule.guestPromptedAt
      ? secondsUntilEscalation(schedule.guestPromptedAt, now)
      : null,
  };
}
