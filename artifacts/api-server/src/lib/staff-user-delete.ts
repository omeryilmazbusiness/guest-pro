/**
 * Hard-delete helpers for hotel staff users (personnel + department managers).
 */

import { db, staffTasksTable, routineTasksTable, usersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";

/** Removes task rows that reference a user before hard-deleting the account. */
export async function purgeStaffUserTaskRefs(userId: number): Promise<void> {
  await db
    .delete(staffTasksTable)
    .where(
      or(
        eq(staffTasksTable.assigneeUserId, userId),
        eq(staffTasksTable.createdByUserId, userId),
      ),
    );

  await db
    .delete(routineTasksTable)
    .where(
      or(
        eq(routineTasksTable.assigneeUserId, userId),
        eq(routineTasksTable.createdByUserId, userId),
      ),
    );
}

export async function hardDeleteHotelUser(hotelId: number, userId: number): Promise<boolean> {
  await purgeStaffUserTaskRefs(userId);

  const deleted = await db
    .delete(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.hotelId, hotelId)))
    .returning({ id: usersTable.id });

  return deleted.length > 0;
}
