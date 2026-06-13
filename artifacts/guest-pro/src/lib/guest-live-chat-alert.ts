/** Pure alert dedupe — show only for message ids the guest has not acknowledged yet. */
export function shouldShowGuestLiveChatAlert(
  unreadCount: number,
  latestMessageId: number | null,
  lastAckMessageId: number,
): boolean {
  if (unreadCount <= 0 || latestMessageId == null) return false;
  return latestMessageId > lastAckMessageId;
}
