'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { IconCampaigns, IconClose, IconExternal, IconFilter, IconSparkle } from '@/components/brand/icons';
import { AssetsGrid, creativeSummary, perPromoterDisplay, TargetingPills } from '@/components/campaigns/CampaignInfo';
import { api, type CampaignDetail, type RoleConfig } from '@/lib/api';
import { titleCase } from '@/lib/format';

const IconTarget = IconFilter;

function Detail({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-[13.5px] text-ink">{children}</dd>
    </div>
  );
}

function fmtRun(starts: string | null, ends: string | null): string {
  if (!starts && !ends) return 'Starts on approval · no fixed end';
  const f = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'open');
  return `${f(starts)} → ${f(ends)}`;
}

function roleConfigChips(rc: RoleConfig): string[] {
  const chips: string[] = [];
  if (rc.content_type) chips.push(`Content: ${rc.content_type}`);
  if (rc.task_mode) chips.push(titleCase(rc.task_mode));
  rc.task_types?.forEach((t) => chips.push(t));
  if (rc.budget_bucket) chips.push(`Budget: ${rc.budget_bucket}`);
  if (rc.following_size) chips.push(`Following: ${rc.following_size}`);
  if (rc.audience_reach) chips.push(`Reach: ${rc.audience_reach}`);
  return chips;
}

/**
 * The rich right-hand review pane for a pending campaign: client + budget,
 * objective/slots, targeting pills, creative summary, asset tiles, and the
 * Reject / Accept actions - mirroring the design's Pending detail.
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

      {/* Full brief - every field the client filled, so the reviewer sees the whole ask. */}
      <div className="mt-5 rounded-2xl border border-rule p-4">
        <div className="mb-3 text-[13px] font-bold text-ink">Brief</div>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Detail label="Description" full>{c.description || <span className="text-muted">Not provided</span>}</Detail>
          <Detail label="Promoter task">{c.task}</Detail>
          <Detail label="Instructions to promoters">{c.promoter_instructions || <span className="text-muted">None</span>}</Detail>
          <Detail label="Destination link" full>
            {c.destination_url
              ? <a href={c.destination_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-semibold text-brand-700 underline">{c.destination_url} <IconExternal className="h-3.5 w-3.5 shrink-0" /></a>
              : <span className="text-muted">No link — promoters post the creative only</span>}
          </Detail>
          <Detail label="Schedule">{c.posts_required > 1 ? `${c.posts_required} posts · ${titleCase(c.cadence)}` : 'One-off post'}</Detail>
          <Detail label="Run window">{fmtRun(c.starts_at, c.ends_at)}</Detail>
          <Detail label="Objective">{titleCase(c.objective)}</Detail>
          <Detail label="Reach">Target {c.expected_reach.toLocaleString()} · verified {c.confirmed_reach.toLocaleString()}</Detail>
        </dl>
        {c.role_config && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {roleConfigChips(c.role_config).map((chip) => (
              <span key={chip} className="rounded-full bg-brand/8 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700">{chip}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-wash p-4">
          <div className="mb-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink"><IconTarget className="h-4 w-4" /> Targeting</div>
          {c.targeting ? <TargetingPills targeting={c.targeting} /> : <p className="text-[13px] text-muted">No targeting set — nationwide, everyone.</p>}
        </div>
        <div className="rounded-2xl bg-wash p-4">
          <div className="mb-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink"><IconSparkle className="h-4 w-4" /> Creative</div>
          <p className="text-[13.5px] text-body">{creativeSummary(c.assets)}</p>
          {c.needs_creative && <p className="mt-1 text-[12px] text-muted">Client asked Ralia to design this.</p>}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2.5 text-[13px] font-semibold text-muted">Assets <span className="font-normal">— click an image to view it full size</span></div>
        <AssetsGrid assets={c.assets} />
      </div>

      {canReview && (c.status === 'PENDING_APPROVAL' || c.status === 'CONFIRMING_PAYMENT') && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="danger" className="w-full" onClick={onReject}><IconClose className="h-4 w-4" /> Reject campaign</Button>
          <Button size="lg" className="w-full" onClick={onAccept} loading={approving}>Accept</Button>
        </div>
      )}
    </div>
  );
}
