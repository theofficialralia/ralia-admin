'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ReasonModal } from '@/components/ui/ReasonModal';
import { IconCopy, IconExternal } from '@/components/brand/icons';
import { api, ApiError, uuid, type PendingSubmission } from '@/lib/api';
import { compactNumber, relativeTime } from '@/lib/format';

/**
 * Proof-review card matching the design: promoter + fee-at-stake, a large
 * screenshot preview, the copyable proof link, and Reject / Approve & Pay.
 * Keeps the verified-views control so pay is pro-rata on what was delivered.
 */
export function SubmissionCard({ submission: s, canReview }: { submission: PendingSubmission; canReview: boolean }) {
  const qc = useQueryClient();
  const [verified, setVerified] = useState<number>(s.claimed_views ?? s.promised_reach);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['submissions'] });
    void qc.invalidateQueries({ queryKey: ['campaign-submissions'] });
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

  function copyUrl() {
    if (!s.public_url) return;
    void navigator.clipboard?.writeText(s.public_url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={s.promoter_name} className="h-9 w-9 rounded-2xl text-[12px]" />
          <div>
            <div className="text-[14.5px] font-bold text-ink">{s.promoter_name ?? 'Unnamed'}</div>
            <div className="text-[12px] text-muted">{s.campaign_name} · {relativeTime(s.submitted_at)}</div>
          </div>
        </div>
      </div>

      {/* Views (admin verifies) + Amount to earn (follows, pro-rata) */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-rule p-3">
          <div className="text-[11px] text-muted">Views</div>
          {canReview ? (
            <input
              type="number"
              min={0}
              value={verified}
              onChange={(e) => { setVerified(Math.max(0, Number(e.target.value))); setError(null); }}
              className="w-full bg-transparent text-[22px] font-extrabold text-ink outline-none"
            />
          ) : (
            <div className="text-[22px] font-extrabold text-ink">{compactNumber(verified)}</div>
          )}
          <div className="text-[11px] text-muted">claimed {s.claimed_views != null ? compactNumber(s.claimed_views) : '—'} · priced for {compactNumber(s.promised_reach)}</div>
        </div>
        <div className="rounded-2xl border border-rule p-3">
          <div className="text-[11px] text-muted">Amount to earn</div>
          <div className="text-[22px] font-extrabold text-brand-700">₦{(estPay / 100).toLocaleString()}</div>
          <div className="text-[11px] text-muted">{Math.round(ratio * 100)}% of {s.fee.amount_display} · {compactNumber(s.clicks)} clicks</div>
        </div>
      </div>

      {/* Proof preview */}
      <a
        href={s.image_url ?? s.public_url ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="relative mx-4 mt-3 flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-rule bg-wash"
      >
        {isHttp ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image_url!} alt="proof" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/25 text-[13px] font-semibold text-white opacity-0 transition hover:opacity-100">Click to open full size</span>
          </>
        ) : (
          <span className="text-[12.5px] text-muted">{s.image_url ? 'Open proof' : 'No screenshot attached'}</span>
        )}
        {s.auto_flag && <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">⚠ Possible duplicate</span>}
      </a>

      {/* Proof URL */}
      {s.public_url && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-rule bg-paper px-3 py-2 text-[13px]">
          <span className="min-w-0 flex-1 truncate text-body">{s.public_url}</span>
          <button onClick={copyUrl} className="text-muted transition hover:text-brand" title="Copy link">
            <IconCopy className="h-[17px] w-[17px]" />
          </button>
          <a href={s.public_url} target="_blank" rel="noreferrer" className="text-muted transition hover:text-brand" title="Open link">
            <IconExternal className="h-[17px] w-[17px]" />
          </a>
        </div>
      )}
      {copied && <div className="mx-4 mt-1 text-[11.5px] text-ok">Copied.</div>}

      {error && <p className="mx-4 mt-3 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-[12.5px] text-brand-700">{error}</p>}

      {canReview && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-rule p-4">
          <Button variant="danger" className="w-full" onClick={() => setRejecting(true)}>✕ Reject</Button>
          <Button className="w-full" onClick={() => approve.mutate()} loading={approve.isPending}>Approve &amp; Pay</Button>
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

