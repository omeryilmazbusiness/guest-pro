/**
 * Floating reception chat windows — fullscreen on mobile, docked on desktop.
 */
import { LiveChatPopup } from "@/components/manager/LiveChatPopup";
import { useLiveChatReception } from "@/components/manager/LiveChatReceptionContext";
import { cn } from "@/lib/utils";

export function LiveChatPopupsLayer() {
  const { openChats, toggleMinimize, closeChat } = useLiveChatReception();

  if (openChats.length === 0) return null;

  return (
    <>
      {openChats.map((chat, idx) => (
        <div
          key={chat.sessionId}
          className={cn(
            "pointer-events-none fixed z-[60]",
            chat.minimized ? "bottom-4 end-4" : "inset-0 md:inset-auto md:bottom-4 md:end-4",
          )}
        >
          <div
            className={cn(
              "pointer-events-auto",
              chat.minimized ? "" : "h-full w-full md:h-auto md:w-auto",
            )}
          >
            <div
              className={cn(!chat.minimized && "h-full md:absolute md:bottom-0 md:end-0")}
              style={
                !chat.minimized && idx > 0
                  ? { transform: `translate(${-idx * 12}px, ${-idx * 12}px)` }
                  : undefined
              }
            >
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
        </div>
      ))}
    </>
  );
}
