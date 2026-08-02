'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { api, type LiveCampaign, type PendingCampaign } from '@/lib/api';
import { titleCase } from '@/lib/format';

export default function CampaignsPage() {
  const [tab, setTab] = useState<'pending' | 'live'>('pending');

  const pending = useQuery({ queryKey: ['queue-campaigns'], queryFn: () => api.get<PendingCampaign[]>('/v1/admin/queues/campaigns') });
  const live = useQuery({ queryKey: ['live-campaigns'], queryFn: () => api.get<LiveCampaign[]>('/v1/admin/live-campaigns'), enabled: tab === 'live' });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Queue · Campaigns</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Review &amp; match campaigns</h1>
        <p className="mt-1 text-[14px] text-muted">Approve what clients submit, then match promoters to what goes live.</p>
      </div>

      <div className="mb-4 inline-flex rounded-full border border-rule bg-paper p-1 text-[14px] font-semibold">
        {(['pending', 'live'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-1.5 transition ${tab === t ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
          >
            {t === 'pending' ? 'Pending' : 'Live'}
            {t === 'pending' && pending.data?.length ? ` (${pending.data.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'pending' ? (
        <List loading={pending.isLoading} empty="No campaigns waiting for review.">
          {(pending.data ?? []).map((c) => (
            <Row key={c.id} id={c.id} name={c.name} status={c.status} objective={c.objective} slots={`${c.slots_total} slots`} price={c.price?.amount_display} sub={null} />
          ))}
        </List>
      ) : (
        <List loading={live.isLoading} empty="No live campaigns yet.">
          {(live.data ?? []).map((c) => (
            <Row key={c.id} id={c.id} name={c.name} status={c.status} objective={c.objective} slots={`${c.slots_filled}/${c.slots_total} filled`} price={c.price?.amount_display} sub={c.client_name} />
          ))}
        </List>
      )}
    </div>
  );
}

function List({ loading, empty, children }: { loading: boolean; empty: string; children: React.ReactNode }) {
  if (loading) return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  if (!items.length) {
    return <div className="card grid place-items-center p-14 text-center text-muted"><div className="text-[15px] font-semibold text-ink">{empty}</div></div>;
  }
  return <div className="space-y-2.5">{children}</div>;
}

function Row({ id, name, status, objective, slots, price, sub }: { id: string; name: string; status: string; objective: string; slots: string; price?: string; sub: string | null }) {
  return (
    <Link href={`/campaigns/${id}`} className="card flex items-center justify-between gap-4 p-4 transition hover:bg-wash">
      <div className="min-w-0">
        <div className="truncate text-[15px] font-bold text-ink">{name}</div>
        <div className="truncate text-[12.5px] text-muted">{titleCase(objective)} · {slots}{sub ? ` · ${sub}` : ''}</div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {price && <div className="text-[15px] font-extrabold text-ink">{price}</div>}
        <StatusPill status={status} />
        <span className="text-brand-700">↗</span>
      </div>
    </Link>
  );
}
