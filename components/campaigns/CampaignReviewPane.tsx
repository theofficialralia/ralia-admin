'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { IconCampaigns } from '@/components/brand/icons';
import { AssetsGrid, creativeSummary, perPromoterDisplay, TargetingPills } from '@/components/campaigns/CampaignInfo';
import { api, type CampaignDetail } from '@/lib/api';
import { titleCase } from '@/lib/format';

/**
 * The rich right-hand review pane for a pending campaign: client + budget,
 * objective/slots, targeting pills, creative summary, asset tiles, and the
 * Reject / Accept actions — mirroring the design's Pending detail.
 */
export function CampaignReviewPane({
  id,
  canReview,
  approving,
  onAccept,
  onReject,
}: {
  id: string;
  canReview: boolean;
  approving: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const q = useQuery({ queryKey: ['campaign', id], queryFn: () => api.get<CampaignDetail>(`/v1/admin/campaigns/${id}`) });

  if (q.isLoading || !q.data) {
    return <div className="card flex h-72 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  }
  const c = q.data;
  const budget = (c.price ?? c.budget).amount_display;
  const per = perPromoterDisplay(c);

  return (
    <div className="card flex flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[12.5px] text-muted">{c.client.name} · c-{id.slice(0, 4)}</div>
          <h2 className="mt-0.5 truncate text-[24px] font-extrabold tracking-tight text-ink">{c.name}</h2>
          <div className="mt-1 flex items-center gap-2 text-[13.5px] text-muted">
            <IconCampaigns className="h-[17px] w-[17px]" /> {titleCase(c.objective)} · {c.slots_total} slots
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[12.5px] text-muted">Campaign budget</div>
          <div className="text-[24px] font-extrabold text-brand-700">{budget}</div>
          {per && <div className="mt-0.5 text-[12.5px] text-muted">≈ {per} per promoter</div>}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-wash p-4">
          <div className="mb-2.5 text-[13px] font-bold text-ink">◎ Targeting</div>
          {c.targeting ? <TargetingPills targeting={c.targeting} /> : <p className="text-[13px] text-muted">No targeting set.</p>}
        </div>
        <div className="rounded-2xl bg-wash p-4">
          <div className="mb-2.5 text-[13px] font-bold text-ink">✧ Creative</div>
          <p className="text-[13.5px] text-body">{creativeSummary(c.assets)}</p>
          {c.needs_creative && <p className="mt-1 text-[12px] text-muted">Client asked Ralia to design this.</p>}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2.5 text-[13px] font-semibold text-muted">Assets</div>
        <AssetsGrid assets={c.assets} />
      </div>

      {canReview && (c.status === 'PENDING_APPROVAL' || c.status === 'CONFIRMING_PAYMENT') && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="danger" className="w-full" onClick={onReject}>✕ Reject campaign</Button>
          <Button size="lg" className="w-full" onClick={onAccept} loading={approving}>Accept</Button>
        </div>
      )}
    </div>
  );
}
