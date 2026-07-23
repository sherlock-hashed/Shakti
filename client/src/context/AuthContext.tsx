import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { setAuthToken } from "@/api/axiosInstance";
import { mockAuth } from "@/api/mockData";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await mockAuth.login(email, password);
    setToken(token);
    setUser(user);
    setAuthToken(token);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await mockAuth.register(name, email, password);
    setToken(token);
    setUser(user);
    setAuthToken(token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, isAuthenticated: !!token, login, register, logout }),
    [user, token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}