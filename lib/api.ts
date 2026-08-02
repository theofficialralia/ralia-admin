import { session } from './session';
import type { Money } from './money';

/**
 * Thin typed client over the Ralia API. Same-origin in dev (Next rewrites proxy
 * /v1 to the API). On a 401 it rotates the refresh token once and retries.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; auth?: boolean; idempotencyKey?: string };

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const token = session.refresh;
  if (!token) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch('/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token }),
      });
      if (!res.ok) {
        session.clear();
        return false;
      }
      session.set(await res.json());
      return true;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function raw<T>(path: string, opts: Options, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== false && session.access) headers.Authorization = `Bearer ${session.access}`;
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && retry && opts.auth !== false) {
    if (await tryRefresh()) return raw<T>(path, opts, false);
  }
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message ?? res.statusText;
    throw new ApiError(res.status, message, data?.code);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => raw<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, extra?: Omit<Options, 'method' | 'body'>) =>
    raw<T>(path, { method: 'POST', body, ...extra }),
  patch: <T>(path: string, body?: unknown) => raw<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => raw<T>(path, { method: 'DELETE' }),
};

export function uuid(): string {
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────────────────────
// Response shapes (from the frozen contract).
// ─────────────────────────────────────────────────────────────

export type Tokens = { access_token: string; refresh_token: string; expires_in: number; token_type: string };
export type Capability = 'REVIEW_EVIDENCE' | 'RECORD_MONEY';
export type Me = {
  id: string;
  email: string;
  phone_e164: string;
  roles: string[];
  capabilities: Capability[];
  status: string;
};

export type VerificationTier = 'SELF' | 'SCREENSHOT' | 'INSIGHTS';

export type AdminChannel = {
  id: string;
  platform: string;
  handle: string | null;
  url: string | null;
  claimed_audience: number;
  effective_reach: number;
  verification_tier: VerificationTier;
  verified_at: string | null;
  is_group: boolean;
  group_members: number | null;
  active_participants: number | null;
  status: string;
};

export type PendingPromoter = {
  user_id: string;
  full_name: string | null;
  location_state: string | null;
  trust_score: number;
  email: string;
  phone_e164: string;
  channels: AdminChannel[];
};

export type PendingCampaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  slots_total: number;
  price: Money | null;
};

export type PendingSubmission = {
  id: string;
  assignment_id: string;
  campaign_id: string;
  promoter_id: string;
  fee: Money;
  auto_flag: boolean;
  public_url: string | null;
  note: string | null;
  submitted_at: string;
  artifacts: { id: string; reuse_of_id: string | null }[];
};

export type PendingWithdrawal = {
  id: string;
  promoter_id: string;
  amount: Money;
  status: string;
  created_at: string;
};

export type GatewayPayment = {
  id: string;
  campaign_id: string;
  reference: string;
  expected: Money;
  gateway: Money;
  ledger: Money;
  matched: boolean;
  status: 'RECORDED' | 'SETTLED' | 'MISMATCH';
  settled: Money | null;
  settlement_ref: string | null;
  settled_at: string | null;
};

export type ReconciliationReport = {
  gateway_total: Money;
  settled_total: Money;
  ledger_matches_gateway: boolean;
  recorded: number;
  settled: number;
  mismatched: number;
  payments: GatewayPayment[];
};

export type AdminDecision = { id: string; status: string; message: string };
