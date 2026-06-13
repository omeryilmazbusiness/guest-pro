/**
 * Floating reception chat windows — always mounted on dashboard (any tab).
 */
import { LiveChatPopup } from "@/components/manager/LiveChatPopup";
import { useLiveChatReception } from "@/components/manager/LiveChatReceptionContext";

export function LiveChatPopupsLayer() {
  const { openChats, toggleMinimize, closeChat } = useLiveChatReception();

  if (openChats.length === 0) return null;

  return (
    <>
      {openChats.map((chat, idx) => (
        <div
          key={chat.sessionId}
          style={{ right: `${16 + idx * 12}px`, bottom: `${16 + idx * 12}px` }}
          className="pointer-events-none fixed inset-0 z-40"
        >
          <div className="pointer-events-auto absolute bottom-4 right-4">
            <LiveChatPopup
              sessionId={chat.sessionId}
              roomNumber={chat.roomNumber}
              guestName={chat.guestName}
              guestLanguage={chat.guestLanguage}
              guestUiLocale={chat.guestUiLocale}
              minimized={chat.minimized}
              onMinimize={() => toggleMinimize(chat.sessionId)}
              onClose={() => closeChat(chat.sessionId)}
            />
          </div>
        </div>
      ))}
    </>
  );
}
