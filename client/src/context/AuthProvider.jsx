import { useEffect, useState } from "react";
import * as authApi from "../api/auth.js";
import { clearToken, getToken, setToken } from "../api/client.js";
import { AuthContext } from "./AuthContext.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // if a token was saved earlier, find out who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    authApi
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, []);

  function saveLogin(data) {
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    saveLogin(await authApi.login(email, password));
  }

  async function register(name, email, password) {
    saveLogin(await authApi.register(name, email, password));
  }

  async function demoLogin(who) {
    saveLogin(await authApi.demoLogin(who));
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = { user, loading, login, register, demoLogin, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
