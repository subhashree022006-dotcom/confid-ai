import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const TOKEN_KEY = "confidai_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe(token) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Invalid session");
      const data = await res.json();
      setUser({ ...data, token });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchMe(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function signup(userId, password) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error };
      localStorage.setItem(TOKEN_KEY, data.token);
      await fetchMe(data.token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  }

  async function login(userId, password) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error };
      localStorage.setItem(TOKEN_KEY, data.token);
      await fetchMe(data.token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function refreshUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await fetchMe(token);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
