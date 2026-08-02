'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type Capability, type Me, type Tokens } from './api';
import { session } from './session';

type AuthState = {
  user: Me | null;
  loading: boolean;
  can: (cap: Capability) => boolean;
  refresh: () => Promise<void>;
  setTokens: (t: Tokens) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!session.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api.get<Me>('/v1/auth/me'));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        session.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const setTokens = useCallback(
    async (t: Tokens) => {
      session.set(t);
      setLoading(true);
      await loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    const token = session.refresh;
    if (token) await api.post('/v1/auth/logout', { refresh_token: token }).catch(() => {});
    session.clear();
    setUser(null);
  }, []);

  const can = useCallback((cap: Capability) => !!user?.capabilities?.includes(cap), [user]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, can, refresh: loadMe, setTokens, logout }),
    [user, loading, can, loadMe, setTokens, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Redirect to /login if there is no authenticated admin once loading settles. */
export function useRequireAuth(): AuthState {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace('/login');
    else if (!auth.loading && auth.user && !auth.user.roles.includes('ADMIN')) router.replace('/login');
  }, [auth.loading, auth.user, router]);
  return auth;
}
