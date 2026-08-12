/** Small display helpers. Money arrives preformatted from the API. */

export function compactNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString();
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s_])\w/g, (m) => m.toUpperCase()).replace(/_/g, ' ');
}

/** A friendly display name derived from an email local-part (no name field on the admin). */
export function nameFromEmail(email: string | null | undefined): string {
  if (!email) return 'Admin';
  const local = email.split('@')[0] ?? '';
  const cleaned = local.replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
  return cleaned ? titleCase(cleaned) : 'Admin';
}

/**
 * The admin's role name, derived from the two real backend capabilities.
 * Both → Super admin · review only → Campaign reviewer · money only → Finance.
 */
export function roleFromCapabilities(caps: string[] | null | undefined): string {
  const set = new Set(caps ?? []);
  const review = set.has('REVIEW_EVIDENCE');
  const money = set.has('RECORD_MONEY');
  if (review && money) return 'Super admin';
  if (review) return 'Campaign reviewer';
  if (money) return 'Finance';
  return 'Support';
}
