'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ReasonModal } from '@/components/ui/ReasonModal';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError, uuid, type PendingSubmission } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compactNumber, relativeTime } from '@/lib/format';

export default function SubmissionsPage() {
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['submissions'], queryFn: () => api.get<PendingSubmission[]>('/v1/admin/queues/submissions') });

  if (q.isLoading) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const items = q.data ?? [];

  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Queue · Evidence</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Review proof</h1>
        <p className="mt-1 text-[14px] text-muted">Check the screenshot against the count, then approve — the promoter is paid pro-rata on the verified views.</p>
      </div>

      {items.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-muted">
          <div className="text-[15px] font-semibold text-ink">Nothing to review</div>
          <div className="mt-1 text-[13.5px]">No submissions are waiting.</div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((s) => (
            <SubmissionCard key={s.id} submission={s} canReview={can('REVIEW_EVIDENCE')} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission: s, canReview }: { submission: PendingSubmission; canReview: boolean }) {
  const qc = useQueryClient();
  const [verified, setVerified] = useState<number>(s.claimed_views ?? s.promised_reach);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['submissions'] });
    void qc.invalidateQueries({ queryKey: ['nav-counts'] });
  };

  const approve = useMutation({
    mutationFn: () => api.post(`/v1/admin/submissions/${s.id}/approve`, { verified_views: verified }, { idempotencyKey: uuid() }),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not approve.'),
  });
  const reject = useMutation({
    mutationFn: (reason: string) => api.post(`/v1/admin/submissions/${s.id}/reject`, { reason }),
    onSuccess: () => { setRejecting(false); invalidate(); },
  });

  const ratio = s.promised_reach > 0 ? Math.min(verified / s.promised_reach, 1) : 0;
  const estPay = Math.round(s.fee.amount_minor * ratio);
  const isHttp = s.image_url?.startsWith('http');

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={s.promoter_name} className="h-8 w-8 text-[12px]" />
          <div>
            <div className="text-[14px] font-bold text-ink">{s.promoter_name ?? 'Unnamed'}</div>
            <div className="text-[12px] text-muted">{s.campaign_name} · {relativeTime(s.submitted_at)}</div>
          </div>
        </div>
        {s.auto_flag && <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand-700">⚠ Possible duplicate</span>}
      </div>

      <div className="flex gap-4 p-4">
        {/* Proof */}
        <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-rule bg-wash">
          {isHttp ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image_url!} alt="proof" className="h-full w-full object-cover" />
          ) : (
            <a href={s.image_url ?? '#'} target="_blank" rel="noreferrer" className="grid h-full w-full place-items-center text-center text-[11px] text-muted">
              {s.image_url ? 'Open proof' : 'No image'}
            </a>
          )}
        </div>

        {/* Numbers */}
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Claimed" value={s.claimed_views != null ? compactNumber(s.claimed_views) : '—'} />
            <Stat label="Clicks" value={compactNumber(s.clicks)} />
            <Stat label="Priced for" value={compactNumber(s.promised_reach)} />
            <Stat label="Fee cap" value={s.fee.amount_display} />
          </div>

          {canReview && (
            <div className="mt-3">
              <Field label="Verified views">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={verified}
                  onChange={(e) => { setVerified(Math.max(0, Number(e.target.value))); setError(null); }}
                />
              </Field>
              <div className="mt-1 text-[12px] text-muted">Pays about <span className="font-semibold text-ink">₦{(estPay / 100).toLocaleString()}</span> ({Math.round(ratio * 100)}% of the cap)</div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="mx-4 mb-3 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-[12.5px] text-brand-700">{error}</p>}

      {canReview && (
        <div className="flex justify-end gap-2 border-t border-rule px-4 py-3">
          <Button variant="danger" onClick={() => setRejecting(true)}>Reject</Button>
          <Button onClick={() => approve.mutate()} loading={approve.isPending}>Approve &amp; pay</Button>
        </div>
      )}

      {rejecting && (
        <ReasonModal
          title="Reject this submission?"
          placeholder="e.g. The view count is not visible in the screenshot."
          confirmLabel="Reject"
          pending={reject.isPending}
          onClose={() => setRejecting(false)}
          onConfirm={(r) => reject.mutate(r)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-wash px-2 py-2">
      <div className="text-[15px] font-extrabold text-ink">{value}</div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
