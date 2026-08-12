'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ReasonModal } from '@/components/ui/ReasonModal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { IconChevronRight } from '@/components/brand/icons';
import { CampaignReviewPane } from '@/components/campaigns/CampaignReviewPane';
import { api, type LiveCampaign, type PendingCampaign } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { titleCase } from '@/lib/format';

export default function CampaignsPage() {
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending');

  return (
    <div>
      <PageHeader crumb="Queue · Campaigns" title="Review &amp; fund campaigns" subtitle="Approve what clients submit, fund the accepted ones, then match promoters to what goes live." />

      <div className="mb-5 grid w-full grid-cols-2 gap-2 rounded-2xl bg-wash p-1.5 text-[14px] font-semibold sm:max-w-xl">
        {(['pending', 'accepted'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2.5 capitalize transition ${tab === t ? 'bg-paper text-brand shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'pending' ? <PendingTab /> : <AcceptedTab />}
    </div>
  );
}

function PendingTab() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const q = useQuery({ queryKey: ['queue-campaigns'], queryFn: () => api.get<PendingCampaign[]>('/v1/admin/queues/campaigns') });
  const items = q.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? items.filter((c) => c.name.toLowerCase().includes(term)) : items;
  }, [items, search]);
  const current = filtered.find((c) => c.id === selected) ?? filtered[0] ?? null;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['queue-campaigns'] });
    void qc.invalidateQueries({ queryKey: ['live-campaigns'] });
    void qc.invalidateQueries({ queryKey: ['nav-counts'] });
  };
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/v1/admin/campaigns/${id}/approve`, {}), onSuccess: () => { setSelected(null); invalidate(); } });
  const reject = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/v1/admin/campaigns/${id}/reject`, { reason }), onSuccess: () => { setRejecting(false); setSelected(null); invalidate(); } });

  if (q.isLoading) return <Loading />;
  if (items.length === 0) return <Empty title="No campaigns waiting" sub="Submitted campaigns appear here for review and funding." />;

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="Search for a campaign" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${current?.id === c.id ? 'border-brand bg-brand/5 shadow-sm' : 'border-rule bg-paper hover:bg-wash'}`}
            >
              <div className="flex items-center gap-3">
                <Avatar name={c.name} className="h-11 w-11 rounded-2xl text-[14px]" />
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-bold text-ink">{c.name}</div>
                  <div className="truncate text-[12px] text-muted">{titleCase(c.objective)} · {c.slots_total} slots</div>
                </div>
              </div>
              <div className="mt-2.5 text-[15px] font-extrabold text-ink">{c.price?.amount_display ?? '—'}</div>
            </button>
          ))}
          {filtered.length === 0 && <div className="rounded-2xl border border-rule p-4 text-center text-[13px] text-muted">No match.</div>}
        </div>

        {current && (
          <CampaignReviewPane
            id={current.id}
            canReview={can('REVIEW_EVIDENCE')}
            approving={approve.isPending}
            onAccept={() => approve.mutate(current.id)}
            onReject={() => setRejecting(true)}
          />
        )}
      </div>

      {rejecting && current && (
        <ReasonModal
          title={`Reject ${current.name}?`}
          placeholder="e.g. The destination link is broken, or the creative violates policy."
          confirmLabel="Reject campaign"
          pending={reject.isPending}
          onClose={() => setRejecting(false)}
          onConfirm={(reason) => reject.mutate({ id: current.id, reason })}
        />
      )}
    </>
  );
}

function AcceptedTab() {
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['live-campaigns'], queryFn: () => api.get<LiveCampaign[]>('/v1/admin/live-campaigns') });
  const items = q.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? items.filter((c) => c.name.toLowerCase().includes(term) || c.client_name.toLowerCase().includes(term)) : items;
  }, [items, search]);

  if (q.isLoading) return <Loading />;
  if (items.length === 0) return <Empty title="No accepted campaigns yet" sub="Funded, live campaigns appear here — open one to manage offers and proofs." />;

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="Search for a campaign" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.id} href={`/campaigns/${c.id}`} className="card group flex items-center gap-3 p-4 transition hover:shadow-lg">
            <Avatar name={c.name} className="h-12 w-12 rounded-2xl text-[15px]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold text-ink">{c.name}</div>
              <div className="truncate text-[12px] text-muted">{c.client_name} · {c.slots_filled}/{c.slots_total} filled</div>
              <div className="mt-1 text-[15px] font-extrabold text-ink">{c.price?.amount_display ?? '—'}</div>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/40 text-brand transition group-hover:bg-brand group-hover:text-white">
              <IconChevronRight className="h-[18px] w-[18px]" />
            </span>
          </Link>
        ))}
        {filtered.length === 0 && <div className="col-span-full rounded-2xl border border-rule p-8 text-center text-[13px] text-muted">No match.</div>}
      </div>
    </>
  );
}

function Loading() {
  return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
}
function Empty({ title, sub }: { title: string; sub: string }) {
  return <div className="card grid place-items-center p-14 text-center text-muted"><div className="text-[15px] font-semibold text-ink">{title}</div><div className="mt-1 text-[13.5px]">{sub}</div></div>;
}
