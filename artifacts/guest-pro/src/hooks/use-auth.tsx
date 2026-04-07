import { useState, useEffect, useCallback } from "react";
import { useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const TOKEN_KEY = "guestpro_token";

// Initialize the global fetch configuration immediately
setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));

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
    setLocation("/");
  }, [setToken, queryClient, setLocation]);

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      logoutAuth();
    }
  }, [isError, logoutAuth]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    token,
    setToken,
    logoutAuth,
  };
}
