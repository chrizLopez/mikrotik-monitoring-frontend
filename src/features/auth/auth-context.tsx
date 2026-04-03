import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "@/features/auth/auth-api";
import { clearAuthToken, getAuthToken } from "@/lib/axios";
import { AuthUser, LoginPayload } from "@/types/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshSession = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    setStatus("loading");

    try {
      const nextUser = await fetchMe();
      setUser(nextUser);
      setStatus("authenticated");
    } catch (error) {
      clearAuthToken();

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      setUser(null);
      setStatus("unauthenticated");
      throw error;
    }
  }, []);

  useEffect(() => {
    void refreshSession().catch(() => undefined);
  }, [refreshSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const nextUser = await loginRequest(payload);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
      refreshSession,
    }),
    [login, logout, refreshSession, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
