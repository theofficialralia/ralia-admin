'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ReasonModal } from '@/components/ui/ReasonModal';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { IconArrowLeft } from '@/components/brand/icons';
import { CampaignDetailsView } from '@/components/campaigns/CampaignInfo';
import { SubmissionCard } from '@/components/campaigns/SubmissionCard';
import { api, uuid, type Candidate, type CampaignDetail, type PendingSubmission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compactNumber, titleCase } from '@/lib/format';

type Tab = 'offers' | 'submissions' | 'details';

export default function CampaignWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>('details');
  const [rejecting, setRejecting] = useState(false);
  const [funding, setFunding] = useState(false);

  const q = useQuery({ queryKey: ['campaign', id], queryFn: () => api.get<CampaignDetail>(`/v1/admin/campaigns/${id}`) });
  const c = q.data;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['campaign', id] });
    void qc.invalidateQueries({ queryKey: ['queue-campaigns'] });
    void qc.invalidateQueries({ queryKey: ['live-campaigns'] });
    void qc.invalidateQueries({ queryKey: ['nav-counts'] });
  };
  const approve = useMutation({ mutationFn: () => api.post(`/v1/admin/campaigns/${id}/approve`, {}), onSuccess: invalidate });
  const reject = useMutation({ mutationFn: (reason: string) => api.post(`/v1/admin/campaigns/${id}/reject`, { reason }), onSuccess: () => { setRejecting(false); invalidate(); } });

  if (q.isLoading || !c) {
    return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  }

  const canReview = can('REVIEW_EVIDENCE');
  const canMoney = can('RECORD_MONEY');
  const live = c.status === 'LIVE' || c.status === 'PAUSED';
  const dateRange = fmtRange(c.starts_at, c.ends_at);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href="/campaigns" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-rule text-muted transition hover:bg-wash hover:text-ink" aria-label="Back">
            <IconArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] font-extrabold tracking-tight text-ink">{c.name}</h1>
              <StatusPill status={c.status} />
            </div>
            <div className="mt-0.5 text-[13.5px] text-muted">{c.client.name}{dateRange ? ` · ${dateRange}` : ''}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-muted">Budget</div>
          <div className="text-[20px] font-extrabold text-ink">{(c.price ?? c.budget).amount_display}</div>
          <div className="text-[12px] text-muted">{c.slots_filled}/{c.slots_total} slots filled</div>
        </div>
      </div>

      {/* Approval / funding action bar */}
      {(c.status === 'PENDING_APPROVAL' || c.status === 'CONFIRMING_PAYMENT') && (
        <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-[13.5px] text-muted">
            {c.status === 'PENDING_APPROVAL' ? 'Review the brief and creative, then approve or reject.' : 'Approved — record the client’s transfer to take it live.'}
          </div>
          <div className="flex gap-2">
            {c.status === 'PENDING_APPROVAL' && canReview && (
              <>
                <Button variant="danger" onClick={() => setRejecting(true)}>Reject</Button>
                <Button onClick={() => approve.mutate()} loading={approve.isPending}>Approve</Button>
              </>
            )}
            {c.status === 'CONFIRMING_PAYMENT' && canMoney && <Button onClick={() => setFunding(true)}>Record funding</Button>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-wash p-1.5 text-[14px] font-semibold sm:inline-grid sm:auto-cols-max sm:grid-flow-col">
        {([['offers', 'Offer management'], ['submissions', 'Submissions'], ['details', 'Campaign details']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl px-6 py-2 transition ${tab === k ? 'bg-paper text-brand shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'offers' && (live ? <OfferManagement campaignId={c.id} canReview={canReview} onOffered={invalidate} /> : <Notice text="Offers open once the campaign is funded and live." />)}
        {tab === 'submissions' && <CampaignSubmissions campaignId={c.id} canReview={canReview} />}
        {tab === 'details' && <CampaignDetailsView c={c} />}
      </div>

      {rejecting && <ReasonModal title={`Reject ${c.name}?`} placeholder="e.g. The destination link is broken." confirmLabel="Reject" pending={reject.isPending} onClose={() => setRejecting(false)} onConfirm={(r) => reject.mutate(r)} />}
      {funding && c.price && <FundModal campaignId={c.id} amountMinor={c.price.amount_minor} amountDisplay={c.price.amount_display} onClose={() => setFunding(false)} onDone={() => { setFunding(false); invalidate(); }} />}
    </div>
  );
}

function fmtRange(a: string | null, b: string | null): string | null {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  if (a && b) return `${fmt(a)} – ${fmt(b)}`;
  if (a) return `from ${fmt(a)}`;
  return null;
}

function Notice({ text }: { text: string }) {
  return <div className="card grid place-items-center p-12 text-center text-[13.5px] text-muted">{text}</div>;
}

function CampaignSubmissions({ campaignId, canReview }: { campaignId: string; canReview: boolean }) {
  const q = useQuery({ queryKey: ['campaign-submissions'], queryFn: () => api.get<PendingSubmission[]>('/v1/admin/queues/submissions') });
  const items = useMemo(() => (q.data ?? []).filter((s) => s.campaign_id === campaignId), [q.data, campaignId]);

  if (q.isLoading) return <div className="flex h-32 items-center justify-center text-brand"><Spinner className="h-6 w-6" /></div>;
  if (items.length === 0) return <Notice text="No proofs waiting for this campaign." />;

  return (
    <>
      <div className="mb-3 text-[14px] font-semibold text-ink">Review proof</div>
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((s) => <SubmissionCard key={s.id} submission={s} canReview={canReview} />)}
      </div>
    </>
  );
}

/** Fit-score colour band, matching the §7 capability tiers. */
function fitColor(pct: number): string {
  if (pct >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-ink';
}

function OfferManagement({ campaignId, onOffered, canReview }: { campaignId: string; onOffered: () => void; canReview: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const candidates = useQuery({ queryKey: ['candidates', campaignId], queryFn: () => api.get<Candidate[]>(`/v1/campaigns/${campaignId}/candidates`) });
  const send = useMutation({
    mutationFn: (ids: string[]) => api.post(`/v1/campaigns/${campaignId}/offers`, { promoter_ids: ids }),
    onSuccess: (offers: unknown) => {
      const n = Array.isArray(offers) ? offers.length : selected.size;
      setNote(`Sent ${n} offer${n === 1 ? '' : 's'}.`);
      setSelected(new Set());
      void candidates.refetch();
      onOffered();
    },
  });
  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const list = candidates.data ?? [];

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-ink">Match promoters</h2>
          <p className="text-[12.5px] text-muted">Eligible promoters, ranked by fit. Select and send offers.</p>
        </div>
        {canReview && (
          <Button onClick={() => send.mutate([...selected])} loading={send.isPending} disabled={selected.size === 0}>
            Send {selected.size > 0 ? selected.size : ''} offer{selected.size === 1 ? '' : 's'}
          </Button>
        )}
      </div>

      {note && <p className="mt-3 rounded-xl border border-ok/30 bg-ok-wash px-4 py-2.5 text-[13px] text-ok">{note}</p>}

      {candidates.isLoading ? (
        <div className="flex h-24 items-center justify-center text-brand"><Spinner className="h-6 w-6" /></div>
      ) : list.length === 0 ? (
        <p className="mt-4 text-[13.5px] text-muted">No eligible promoters right now — none match the targeting, or all have been offered.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {list.map((c) => {
            const checked = selected.has(c.promoter_id);
            return (
              <button
                key={c.promoter_id}
                onClick={() => canReview && toggle(c.promoter_id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${checked ? 'border-brand bg-brand/5' : 'border-rule hover:bg-wash'}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-brand bg-brand text-white' : 'border-rule'}`}>{checked ? '✓' : ''}</span>
                <Avatar name={c.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-ink">{c.full_name ?? 'Unnamed'}</div>
                  <div className="truncate text-[12px] text-muted">{titleCase(c.channel.platform)} · {c.location_state ?? '—'} · trust {c.trust_score} · {c.capability_tier}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-[15px] font-extrabold ${fitColor(c.fit_pct)}`}>{c.fit_pct}<span className="text-[10px] font-semibold text-muted"> % fit</span></div>
                  <div className="text-[11px] text-muted">{compactNumber(c.channel.effective_reach)} reach · {c.assignments_this_week}/{c.max_campaigns_per_week} wk</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FundModal({ campaignId, amountMinor, amountDisplay, onClose, onDone }: { campaignId: string; amountMinor: number; amountDisplay: string; onClose: () => void; onDone: () => void }) {
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record() {
    setBusy(true); setError(null);
    try { await api.post(`/v1/admin/campaigns/${campaignId}/fund`, { amount_minor: amountMinor, reference }, { idempotencyKey: uuid() }); onDone(); }
    catch { setError('Could not record funding. Check the amount matches the quoted price.'); setBusy(false); }
  }

  return (
    <Modal title="Record the client’s transfer" onClose={onClose}>
      <p className="text-[13.5px] text-muted">This posts DR bank-clearing / CR escrow and takes the campaign live. The amount must match the quote.</p>
      <div className="mt-4 rounded-xl bg-wash p-3 text-center">
        <div className="text-[12px] text-muted">Amount to record</div>
        <div className="text-[22px] font-extrabold text-ink">{amountDisplay}</div>
      </div>
      <Field label="Bank reference">
        <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. GTB transfer 8837261" />
      </Field>
      {error && <p className="mt-2 text-[12px] text-brand-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={record} loading={busy}>Record &amp; go live</Button>
      </div>
    </Modal>
  );
}
