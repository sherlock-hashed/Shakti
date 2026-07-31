import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { axiosInstance, setAuthToken } from "@/api/axiosInstance";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("pb_token"),
  );
  const [loading, setLoading] = useState(!!localStorage.getItem("pb_token"));

  // On mount: if we have a saved token, validate it and fetch user
  useEffect(() => {
    const savedToken = localStorage.getItem("pb_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }
    setAuthToken(savedToken);
    axiosInstance
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setToken(savedToken);
      })
      .catch(() => {
        // Token is invalid/expired — clear it
        localStorage.removeItem("pb_token");
        setAuthToken(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("pb_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
      });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem("pb_token", newToken);
      setToken(newToken);
      setUser(newUser);
      setAuthToken(newToken);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("pb_token");
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
