"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from "@/utils/authStorage";

type AuthContextValue = {
  token: string | null;
  userId: string | null;
  isLoggedIn: boolean;
  setAuth: (token: string, userId: string) => void;
  logout: (redirectTo?: string) => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  token: null,
  userId: null,
  isLoggedIn: false,
  setAuth: () => {},
  logout: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const stored = getStoredAuth();
    setToken(stored.token);
    setUserId(stored.userId);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    const handleAuthChanged = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);
    window.addEventListener("focus", handleAuthChanged);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
      window.removeEventListener("focus", handleAuthChanged);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  const setAuth = useCallback(
    (nextToken: string, nextUserId: string) => {
      setStoredAuth(nextToken, nextUserId);
      refresh();
    },
    [refresh],
  );

  const logout = useCallback(
    (redirectTo = "/login") => {
      clearStoredAuth();
      refresh();
      router.push(redirectTo);
    },
    [refresh, router],
  );

  const value = useMemo(
    () => ({
      token,
      userId,
      isLoggedIn: Boolean(token),
      setAuth,
      logout,
      refresh,
    }),
    [token, userId, setAuth, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
