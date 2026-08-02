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
  campaign_name: string;
  objective: string;
  promoter_id: string;
  promoter_name: string | null;
  fee: Money;
  promised_reach: number;
  claimed_views: number | null;
  auto_flag: boolean;
  public_url: string | null;
  note: string | null;
  image_url: string | null;
  submitted_at: string;
  artifacts: { id: string; reuse_of_id: string | null }[];
};

export type PendingWithdrawal = {
  id: string;
  promoter_id: string;
  promoter_name: string | null;
  amount: Money;
  status: string;
  bank: { account_name: string; last4: string; bank_code: string };
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

export type LiveCampaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  slots_total: number;
  slots_filled: number;
  client_name: string;
  price: Money | null;
};

export type CampaignTargeting = {
  states: string[];
  lgas: string[];
  age_min: number | null;
  age_max: number | null;
  genders: string[];
  languages: string[];
  categories: string[];
  platforms: string[];
  min_effective_reach: number;
  roles: string[];
};

export type CampaignAsset = { id: string; kind: string; caption_text: string | null; file_id: string | null };

export type CampaignDetail = {
  id: string;
  name: string;
  status: string;
  objective: string;
  description: string | null;
  promoter_instructions: string | null;
  destination_url: string | null;
  needs_creative: boolean;
  slots_total: number;
  slots_filled: number;
  price: Money | null;
  budget: Money;
  quoted_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  client: { org_id: string; name: string; industry: string | null };
  targeting: CampaignTargeting | null;
  assets: CampaignAsset[];
};

export type Candidate = {
  promoter_id: string;
  full_name: string | null;
  location_state: string | null;
  trust_score: number;
  channel: { id: string; platform: string; effective_reach: number };
  assignments_this_week: number;
  max_campaigns_per_week: number;
};

export type Offer = {
  id: string;
  campaign_id: string;
  campaign_name: string;
  role: string;
  fee_minor: number;
  expires_at: string;
  status: string;
};

export type AdminClient = {
  org_id: string;
  name: string;
  email: string;
  industry: string | null;
  status: string;
  campaigns_created: number;
  spent: Money;
  created_at: string;
};

export type PlatformRules = {
  rpm_minor: number;
  take_rate_pct: number;
  delivery_threshold_pct: number;
  unverified_reach_cap: number;
  proof_validity_days: number;
  min_trust_score: number;
  offer_expiry_hours: number;
  withdrawal_minimum_minor: number;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  created_at: string;
};

export type TeamMember = { id: string; email: string; status: string; capabilities: Capability[] };

export type StatusCount = { status: string; count: number };

export type PlatformAnalytics = {
  gmv: Money;
  revenue: Money;
  take_rate_pct: number;
  live_campaigns: number;
  active_promoters: number;
  active_clients: number;
  promoters_by_status: StatusCount[];
  campaigns_by_status: StatusCount[];
};

export type AdminDecision = { id: string; status: string; message: string };
