import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!user;

  const fetchUser = useCallback(async (tok) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === "success") {
          setUser(json.data);
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("geoagri_token") : null;
    if (stored) {
      setToken(stored);
      fetchUser(stored).then((ok) => {
        if (!ok) {
          localStorage.removeItem("geoagri_token");
          setToken(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.status === "success") {
      setToken(json.data.token);
      setUser(json.data.user);
      localStorage.setItem("geoagri_token", json.data.token);
      return { success: true, user: json.data.user };
    }
    return { success: false, message: json.message || json.errors?.email?.[0] || "Login gagal" };
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("geoagri_token");
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
