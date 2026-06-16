/**
 * Floating reception chat windows — fullscreen on mobile, docked on desktop.
 * Portaled to document.body so Framer Motion transforms cannot clip fixed layout.
 */
import { createPortal } from "react-dom";
import { LiveChatPopup } from "@/components/manager/LiveChatPopup";
import { useLiveChatReception } from "@/components/manager/LiveChatReceptionContext";
import { cn } from "@/lib/utils";

export function LiveChatPopupsLayer() {
  const { openChats, toggleMinimize, closeChat } = useLiveChatReception();

  if (openChats.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <>
      {openChats.map((chat, idx) => (
        <div
          key={chat.sessionId}
          className={cn(
            "fixed z-[220]",
            chat.minimized
              ? "bottom-4 end-4"
              : "inset-0 sm:inset-auto sm:bottom-4 sm:end-4",
          )}
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
      ))}
    </>,
    document.body,
  );
}
