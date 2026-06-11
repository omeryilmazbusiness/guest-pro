import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useLogout } from "@workspace/api-client-react";
import { GuestLogoutConfirmDialog } from "@/components/guest/GuestLogoutConfirmDialog";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";

interface GuestLogoutOpenOptions {
  onBeforeLogout?: () => void;
}

interface GuestLogoutContextValue {
  openLogoutConfirm: (options?: GuestLogoutOpenOptions) => void;
}

const GuestLogoutContext = createContext<GuestLogoutContextValue | null>(null);

export function GuestLogoutProvider({ children }: { children: ReactNode }) {
  const { logoutAuth } = useAuth();
  const logoutMutation = useLogout();
  const { t } = useLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const beforeLogoutRef = useRef<(() => void) | undefined>(undefined);

  const openLogoutConfirm = useCallback((options?: GuestLogoutOpenOptions) => {
    beforeLogoutRef.current = options?.onBeforeLogout;
    setConfirmOpen(true);
  }, []);

  const closeLogoutConfirm = useCallback(() => {
    setConfirmOpen(false);
    beforeLogoutRef.current = undefined;
  }, []);

  const confirmLogout = useCallback(() => {
    setConfirmOpen(false);
    beforeLogoutRef.current?.();
    beforeLogoutRef.current = undefined;
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success(t.logoutSuccess);
  }, [logoutAuth, logoutMutation, t.logoutSuccess]);

  const value = useMemo(() => ({ openLogoutConfirm }), [openLogoutConfirm]);

  return (
    <GuestLogoutContext.Provider value={value}>
      {children}
      <GuestLogoutConfirmDialog
        open={confirmOpen}
        onCancel={closeLogoutConfirm}
        onConfirm={confirmLogout}
      />
    </GuestLogoutContext.Provider>
  );
}

export function useGuestLogout() {
  const ctx = useContext(GuestLogoutContext);
  if (!ctx) {
    throw new Error("useGuestLogout must be used within GuestLogoutProvider");
  }
  return ctx;
}
