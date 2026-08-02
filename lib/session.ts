/**
 * Admin token storage. Namespaced apart from the client app so the two can run
 * on the same machine without colliding. localStorage for the MVP — an httpOnly
 * refresh cookie is the hardening follow-up.
 */
const ACCESS = 'ralia.admin.access';
const REFRESH = 'ralia.admin.refresh';

export const session = {
  get access(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS);
  },
  get refresh(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH);
  },
  set(tokens: { access_token: string; refresh_token: string }) {
    localStorage.setItem(ACCESS, tokens.access_token);
    localStorage.setItem(REFRESH, tokens.refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};
