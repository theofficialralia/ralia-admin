'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { IconSearch } from '@/components/brand/icons';
import { api, type AdminLeaderboard, type PromoterTier } from '@/lib/api';

const TIER: Record<PromoterTier, { label: string; badge: string; dot: string }> = {
  BRONZE: { label: 'Bronze', badge: 'bg-[#b5744a]/15 text-[#a5623a]', dot: 'bg-[#b5744a]' },
  SILVER: { label: 'Silver', badge: 'bg-slate-400/20 text-slate-500', dot: 'bg-slate-400' },
  GOLD: { label: 'Gold', badge: 'bg-amber-400/20 text-amber-600', dot: 'bg-amber-500' },
  PLATINUM: { label: 'Platinum', badge: 'bg-indigo-400/20 text-indigo-500', dot: 'bg-indigo-500' },
};

function TierBadge({ tier }: { tier: PromoterTier }) {
  const t = TIER[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${t.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} /> {t.label}
    </span>
  );
}

export default function AdminLeaderboardPage() {
  const q = useQuery({ queryKey: ['admin-leaderboard'], queryFn: () => api.get<AdminLeaderboard>('/v1/admin/leaderboard') });
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const all = q.data?.rows ?? [];
    const term = search.trim().toLowerCase();
    return term ? all.filter((r) => (r.full_name ?? '').toLowerCase().includes(term)) : all;
  }, [q.data, search]);

  if (q.isLoading) return <div className="grid h-64 place-items-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const data = q.data!;

  return (
    <div>
      <PageHeader crumb={`Admin · Season ${data.season}`} title="Leaderboard" subtitle={`Promoter standings this season — ${data.total.toLocaleString()} ranked. Points build rank and tier; tiers gate campaigns.`} />

      {data.total > 8 && (
        <div className="relative mb-4 max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input className="input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search promoters" />
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="hidden grid-cols-[56px_1fr_130px_110px_110px_90px] gap-3 border-b border-rule px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-muted sm:grid">
          <span>Rank</span><span>Promoter</span><span>Tier</span><span className="text-right">Season</span><span className="text-right">All-time</span><span className="text-right">Streak</span>
        </div>
        {rows.length === 0 && <div className="p-10 text-center text-[13.5px] text-muted">{data.total === 0 ? 'No promoter has earned points yet this season.' : 'No promoters match your search.'}</div>}
        <div className="divide-y divide-rule">
          {rows.map((r) => (
            <div key={r.promoter_id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[56px_1fr_130px_110px_110px_90px] sm:px-5">
              <span className={`text-center text-[15px] font-extrabold tabular-nums ${r.rank <= 3 ? 'text-brand-700' : 'text-muted'}`}>{r.rank}</span>
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={r.full_name} className="h-9 w-9 text-[12px]" />
                <span className="truncate text-[14px] font-bold text-ink">{r.full_name ?? 'Unnamed promoter'}</span>
              </div>
              <div className="hidden sm:block"><TierBadge tier={r.tier} /></div>
              <span className="hidden text-right text-[14px] font-extrabold tabular-nums text-ink sm:block">{r.season_points.toLocaleString()}</span>
              <span className="hidden text-right text-[13.5px] tabular-nums text-muted sm:block">{r.lifetime_points.toLocaleString()}</span>
              <span className="hidden text-right text-[13.5px] tabular-nums text-muted sm:block">{r.streak}</span>
              {/* Compact (mobile) trailing cell */}
              <div className="flex items-center gap-2 sm:hidden">
                <TierBadge tier={r.tier} />
                <span className="text-[14px] font-extrabold tabular-nums text-ink">{r.season_points.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
