import { createContext, useContext, type ReactNode } from "react";
import { useGuestLiveChatUnread } from "@/hooks/use-guest-live-chat-unread";
import { GuestLiveChatMessageAlert } from "@/components/guest/GuestLiveChatMessageAlert";

type GuestLiveChatUnreadContextValue = ReturnType<typeof useGuestLiveChatUnread>;

const GuestLiveChatUnreadContext = createContext<GuestLiveChatUnreadContextValue | null>(null);

export function GuestLiveChatUnreadProvider({ children }: { children: ReactNode }) {
  const value = useGuestLiveChatUnread();

  return (
    <GuestLiveChatUnreadContext.Provider value={value}>
      {children}
      <GuestLiveChatMessageAlert
        open={value.showAlert}
        preview={value.preview}
        unreadCount={value.unreadCount}
        onDismiss={value.dismissAlert}
      />
    </GuestLiveChatUnreadContext.Provider>
  );
}

export function useGuestLiveChatUnreadContext(): GuestLiveChatUnreadContextValue {
  const ctx = useContext(GuestLiveChatUnreadContext);
  if (!ctx) {
    return {
      unreadCount: 0,
      preview: null,
      showAlert: false,
      dismissAlert: () => {},
      acknowledgeSeen: async () => {},
      refresh: async () => true,
    };
  }
  return ctx;
}
