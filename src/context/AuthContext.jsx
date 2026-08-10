import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const USERS_KEY = "confidai_users";
const SESSION_KEY = "confidai_session";

function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) setUser(JSON.parse(session));
    setLoading(false);
  }, []);

  function signup(userId, password) {
    const users = loadUsers();
    if (users[userId]) return { ok: false, error: "That user ID is already taken." };
    users[userId] = { password, createdAt: Date.now() };
    saveUsers(users);
    const session = { userId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true };
  }

  function login(userId, password) {
    const users = loadUsers();
    const record = users[userId];
    if (!record || record.password !== password) return { ok: false, error: "Invalid user ID or password." };
    const session = { userId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}