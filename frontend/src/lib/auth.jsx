import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(() => !tokenStore.get());

  const clear = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    if (!tokenStore.get()) return;
    api.me().then(setUser).catch(clear).finally(() => setReady(true));
  }, [clear]);

  const value = useMemo(() => ({
    user,
    ready,
    async login(credentials) {
      const { token, user } = await api.login(credentials);
      tokenStore.set(token);
      setUser(user);
    },
    async register(details) {
      const { token, user } = await api.register(details);
      tokenStore.set(token);
      setUser(user);
    },
    async logout() {
      try { await api.logout(); } catch { /* token may already be gone */ }
      clear();
    },
  }), [user, ready, clear]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
