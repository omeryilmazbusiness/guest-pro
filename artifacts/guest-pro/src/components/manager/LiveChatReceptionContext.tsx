import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LiveChatInboxItem } from "@/lib/live-chat-api";

export interface LiveChatOpenSession {
  sessionId: number;
  roomNumber: string;
  guestName: string;
  guestLanguage: string;
  guestUiLocale: string;
  minimized: boolean;
}

interface LiveChatReceptionContextValue {
  openChats: LiveChatOpenSession[];
  openChat: (item: LiveChatInboxItem) => void;
  toggleMinimize: (sessionId: number) => void;
  closeChat: (sessionId: number) => void;
}

const LiveChatReceptionContext = createContext<LiveChatReceptionContextValue | null>(
  null,
);

export function LiveChatReceptionProvider({ children }: { children: ReactNode }) {
  const [openChats, setOpenChats] = useState<LiveChatOpenSession[]>([]);

  const openChat = useCallback((item: LiveChatInboxItem) => {
    const guestName =
      [item.guestFirstName, item.guestLastName].filter(Boolean).join(" ") || "Guest";
    setOpenChats((prev) => {
      if (prev.some((c) => c.sessionId === item.sessionId)) {
        return prev.map((c) =>
          c.sessionId === item.sessionId
            ? {
                ...c,
                minimized: false,
                guestUiLocale: item.guestUiLocale || c.guestUiLocale,
              }
            : c,
        );
      }
      return [
        ...prev,
        {
          sessionId: item.sessionId,
          roomNumber: item.roomNumber,
          guestName,
          guestLanguage: item.guestLanguage || "en",
          guestUiLocale: item.guestUiLocale || item.guestLanguage || "en",
          minimized: false,
        },
      ];
    });
  }, []);

  const toggleMinimize = useCallback((sessionId: number) => {
    setOpenChats((prev) =>
      prev.map((c) => (c.sessionId === sessionId ? { ...c, minimized: !c.minimized } : c)),
    );
  }, []);

  const closeChat = useCallback((sessionId: number) => {
    setOpenChats((prev) => prev.filter((c) => c.sessionId !== sessionId));
  }, []);

  const value = useMemo(
    () => ({ openChats, openChat, toggleMinimize, closeChat }),
    [openChats, openChat, toggleMinimize, closeChat],
  );

  return (
    <LiveChatReceptionContext.Provider value={value}>
      {children}
    </LiveChatReceptionContext.Provider>
  );
}

export function useLiveChatReception() {
  const ctx = useContext(LiveChatReceptionContext);
  if (!ctx) {
    throw new Error("useLiveChatReception must be used within LiveChatReceptionProvider");
  }
  return ctx;
}

/** Optional hook for components that may render outside the provider. */
export function useOptionalLiveChatReception() {
  return useContext(LiveChatReceptionContext);
}
