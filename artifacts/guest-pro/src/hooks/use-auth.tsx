import { useState, useEffect, useCallback } from "react";
import { useGetMe, setAuthTokenGetter, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getLogoutNavigateTarget } from "@/lib/tenant-path";
import { usePersistentSession } from "@/hooks/use-persistent-session";

const TOKEN_KEY = "guestpro_token";

setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 401
  );
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setTokenState(newToken);
  }, []);

  const logoutAuth = useCallback(() => {
    setToken(null);
    queryClient.clear();
    setLocation(getLogoutNavigateTarget(), { replace: true });
  }, [setToken, queryClient, setLocation]);

  const { data: user, isLoading, isError, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: (failureCount, err) => {
        if (isUnauthorizedError(err)) return false;
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
    },
  });

  usePersistentSession({
    token,
    setToken,
    onSessionInvalid: logoutAuth,
  });

  useEffect(() => {
    if (isError && isUnauthorizedError(error)) {
      logoutAuth();
    }
  }, [isError, error, logoutAuth]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    token,
    setToken,
    logoutAuth,
  };
}
