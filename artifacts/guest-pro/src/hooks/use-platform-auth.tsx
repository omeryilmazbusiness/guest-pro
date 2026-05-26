import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  getPlatformToken,
  platformMe,
  setPlatformToken,
  type PlatformAdminUser,
} from "@/lib/platform-api";
import { ROUTES } from "@/lib/app-routes";

interface PlatformAuthContextValue {
  user: PlatformAdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Persist token and user immediately after OTP (avoids redirect race). */
  completeLogin: (token: string, user: PlatformAdminUser) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<PlatformAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(!!getPlatformToken());

  const refresh = useCallback(async () => {
    const token = getPlatformToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const me = await platformMe();
      setUser(me);
    } catch {
      setPlatformToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeLogin = useCallback((token: string, nextUser: PlatformAdminUser) => {
    setPlatformToken(token);
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  const setToken = useCallback(
    (token: string | null) => {
      if (!token) {
        setPlatformToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      setPlatformToken(token);
      void refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    setPlatformToken(null);
    setUser(null);
    setLocation(ROUTES.platformLogin);
  }, [setLocation]);

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        completeLogin,
        setToken,
        logout,
        refresh,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
  return ctx;
}
