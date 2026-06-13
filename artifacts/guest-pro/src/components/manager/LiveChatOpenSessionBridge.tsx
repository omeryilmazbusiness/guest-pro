import { useEffect } from "react";
import { useLiveChatReception } from "@/components/manager/LiveChatReceptionContext";
import { onLiveChatOpenSession } from "@/lib/live-chat-open-session";

/** Opens chat popup from global events (e.g. emergency overlay) on any dashboard tab. */
export function LiveChatOpenSessionBridge() {
  const { openChat } = useLiveChatReception();

  useEffect(() => {
    return onLiveChatOpenSession((event) => {
      openChat({
        sessionId: event.sessionId,
        guestId: event.guestId,
        roomNumber: event.roomNumber,
        guestFirstName: event.guestFirstName,
        guestLastName: event.guestLastName,
        guestLanguage: event.guestLanguage,
        guestUiLocale: event.guestUiLocale ?? event.guestLanguage,
        lastMessageAt: event.createdAt,
        lastMessagePreview: "",
        hasUnread: true,
        staffTyping: false,
        emergencyAt: event.createdAt,
        emergencyAcknowledged: false,
      });
    });
  }, [openChat]);

  return null;
}
