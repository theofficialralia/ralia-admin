'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { api, type AdminChannel, type PendingPromoter } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compactNumber, titleCase } from '@/lib/format';

/** Capability band, matching the backend §7 tiers. */
function capabilityTier(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Established';
  if (score >= 40) return 'Developing';
  return 'Emerging';
}

export default function PromotersPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const q = useQuery({
    queryKey: ['promoters'],
    queryFn: () => api.get<PendingPromoter[]>('/v1/admin/queues/promoters'),
  });

  const promoters = q.data ?? [];
  const current = promoters.find((p) => p.user_id === selected) ?? promoters[0] ?? null;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['promoters'] });
    void qc.invalidateQueries({ queryKey: ['nav-counts'] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/v1/admin/promoters/${id}/approve`, {}),
    onSuccess: () => {
      setSelected(null);
      invalidate();
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/v1/admin/promoters/${id}/reject`, { reason }),
    onSuccess: () => {
      setRejecting(false);
      setSelected(null);
      invalidate();
    },
  });

  if (q.isLoading) {
    return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  }

  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Queue · Users</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Approve promoters</h1>
        <p className="mt-1 text-[14px] text-muted">A promoter sees no offers until you approve them. Check the reach evidence matches what they claimed.</p>
      </div>

      {promoters.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-muted">
          <div className="text-[15px] font-semibold text-ink">Nothing waiting</div>
          <div className="mt-1 text-[13.5px]">The approval queue is empty.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          {/* Master list */}
          <div className="space-y-2">
            {promoters.map((p) => (
              <button
                key={p.user_id}
                onClick={() => setSelected(p.user_id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  current?.user_id === p.user_id ? 'border-brand bg-brand/5' : 'border-rule bg-paper hover:bg-wash'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.full_name} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-bold text-ink">{p.full_name ?? 'Unnamed'}</div>
                    <div className="truncate text-[12px] text-muted">{p.location_state ?? '—'} · trust {p.trust_score}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          {current && <PromoterDetail promoter={current} canReview={can('REVIEW_EVIDENCE')} onApprove={() => approve.mutate(current.user_id)} onReject={() => setRejecting(true)} approving={approve.isPending} onChanged={invalidate} />}
        </div>
      )}

      {rejecting && current && (
        <RejectModal name={current.full_name} pending={reject.isPending} error={reject.error} onClose={() => setRejecting(false)} onConfirm={(reason) => reject.mutate({ id: current.user_id, reason })} />
      )}
    </div>
  );
}

function PromoterDetail({
  promoter,
  canReview,
  onApprove,
  onReject,
  approving,
  onChanged,
}: {
  promoter: PendingPromoter;
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  onChanged: () => void;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={promoter.full_name} className="h-12 w-12 text-[15px]" />
          <div>
            <div className="text-[18px] font-extrabold text-ink">{promoter.full_name ?? 'Unnamed'}</div>
            <div className="text-[13px] text-muted">{promoter.email} · {promoter.phone_e164}</div>
            <div className="text-[13px] text-muted">{promoter.location_state ?? '—'} · trust {promoter.trust_score}/100</div>
          </div>
        </div>
        {canReview && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={onReject}>Reject</Button>
            <Button onClick={onApprove} loading={approving}>Approve</Button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-[13px] font-semibold text-ink">Capability</div>
        <p className="mb-3 text-[12.5px] text-muted">Computed from what they told us and their verified reach. Approving confirms this.</p>
        {promoter.roles.length === 0 ? (
          <div className="rounded-xl border border-rule p-4 text-[13px] text-muted">No roles selected yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {promoter.roles.map((role) => {
              const score = promoter.capability_preview[role] ?? 0;
              return (
                <div key={role} className="rounded-xl border border-rule px-3.5 py-2">
                  <div className="text-[12px] font-semibold text-ink">{titleCase(role)}</div>
                  <div className="text-[15px] font-extrabold text-ink">{score}<span className="text-[11px] font-semibold text-muted"> · {capabilityTier(score)}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-[13px] font-semibold text-ink">Channels · {promoter.channels.length}</div>
        <p className="mb-3 text-[12.5px] text-muted">Effective reach is what Ralia pays on. Verify a channel to lift it above the self-reported cap.</p>
        <div className="space-y-3">
          {promoter.channels.length === 0 && <div className="rounded-xl border border-rule p-4 text-[13px] text-muted">No channels submitted.</div>}
          {promoter.channels.map((c) => (
            <ChannelRow key={c.id} channel={c} canReview={canReview} onChanged={onChanged} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelRow({ channel, canReview, onChanged }: { channel: AdminChannel; canReview: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function verify(tier: 'SCREENSHOT' | 'INSIGHTS') {
    setBusy(tier);
    try {
      await api.post(`/v1/admin/channels/${channel.id}/verify`, { tier });
      onChanged();
    } finally {
      setBusy(null);
    }
  }
  async function unverify() {
    setBusy('unverify');
    try {
      await api.post(`/v1/admin/channels/${channel.id}/unverify`, { reason: 'Proof not accepted' });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  const basis = channel.is_group ? `${compactNumber(channel.active_participants ?? 0)} active` : `${compactNumber(channel.claimed_audience)} claimed`;

  return (
    <div className="rounded-xl border border-rule p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
            {titleCase(channel.platform)}
            {channel.handle && <span className="text-[12.5px] font-normal text-muted">{channel.handle}</span>}
          </div>
          <div className="text-[12.5px] text-muted">{basis} · <span className="font-semibold text-ink">{compactNumber(channel.effective_reach)}</span> effective reach</div>
        </div>
        <StatusPill status={channel.verification_tier} />
      </div>

      {canReview && (
        <div className="mt-3 flex flex-wrap gap-2">
          {channel.verification_tier === 'SELF' ? (
            <>
              <Button size="sm" variant="secondary" loading={busy === 'SCREENSHOT'} onClick={() => verify('SCREENSHOT')}>Verify · screenshot</Button>
              <Button size="sm" variant="secondary" loading={busy === 'INSIGHTS'} onClick={() => verify('INSIGHTS')}>Verify · insights</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" loading={busy === 'unverify'} onClick={unverify}>Drop to self-reported</Button>
          )}
        </div>
      )}
    </div>
  );
}

function RejectModal({
  name,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  name: string | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={`Reject ${name ?? 'promoter'}?`} onClose={onClose}>
      <p className="text-[13.5px] text-muted">A reason is required — the promoter sees it and can fix their profile.</p>
      <Field>
        <textarea className="input mt-3 min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The WhatsApp screenshot does not show a follower count." />
      </Field>
      {error != null && <p className="mt-2 text-[12px] text-brand-700">Could not reject — try again.</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant="danger" onClick={() => onConfirm(reason)} loading={pending} disabled={reason.trim().length < 5}>Reject</Button>
      </div>
    </Modal>
  );
}
