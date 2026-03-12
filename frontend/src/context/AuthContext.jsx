import { createContext, useContext, useState, useCallback } from "react";
import api from "../api";

const AuthContext = createContext(null);

/** Safely decode a JWT payload without verifying the signature. */
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  // Rehydrate auth state from localStorage on first mount
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = decodeToken(token);
    return {
      token,
      role: payload.role || localStorage.getItem("role"),
      username: payload.sub || localStorage.getItem("username"),
    };
  });

  const login = useCallback(async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { access_token } = res.data;
    const payload = decodeToken(access_token);
    const role = payload.role || "teacher";

    localStorage.setItem("token", access_token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);

    const userData = { token: access_token, role, username };
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUser(null);
  }, []);

  const register = useCallback(async (username, password, role) => {
    await api.post("/auth/register", { username, password, role });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
