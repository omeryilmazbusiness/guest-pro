import { db, auditLogsTable } from "@workspace/db";

export async function logPlatformAudit(
  actorId: number,
  action: string,
  metadata?: Record<string, unknown>,
  hotelId?: number | null,
): Promise<void> {
  await db.insert(auditLogsTable).values({
    hotelId: hotelId ?? null,
    actorId,
    actorType: "platform_admin",
    action,
    targetType: metadata?.targetType as string | undefined,
    targetId: typeof metadata?.targetId === "number" ? metadata.targetId : undefined,
    metadata: metadata ?? {},
  });
}
