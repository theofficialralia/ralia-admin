'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, type PlatformAnalytics, type StatusCount } from '@/lib/api';
import { compactNumber, titleCase } from '@/lib/format';

export default function AnalyticsPage() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: () => api.get<PlatformAnalytics>('/v1/admin/analytics') });

  if (q.isLoading || !q.data) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const a = q.data;

  return (
    <div>
      <PageHeader title="Performance analytics" subtitle="How the marketplace is doing right now." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total GMV (funded)" value={a.gmv.amount_display} accent="brand" sub="Client spend taken live" />
        <StatCard label="Revenue / commissions" value={a.revenue.amount_display} accent="ok" delta={`${a.take_rate_pct}% take rate`} deltaTone="muted" />
        <StatCard label="Live campaigns" value={String(a.live_campaigns)} accent="warn" />
        <StatCard label="Active promoters" value={compactNumber(a.active_promoters)} accent="ink" sub={`${a.active_clients} active clients`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <BarCard title="Promoters by status" subtitle="Across the whole marketplace" rows={a.promoters_by_status} />
        <BarCard title="Campaigns by status" subtitle="Across the whole marketplace" rows={a.campaigns_by_status} />
      </div>
    </div>
  );
}

/** Palette cycled across bar rows — brand red, deep red, ink, green, amber. */
const BAR_COLORS = ['bg-brand', 'bg-brand-700', 'bg-ink/70', 'bg-ok', 'bg-warn'];

function BarCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: StatusCount[] }) {
  const sorted = [...rows].sort((x, y) => y.count - x.count);
  const max = Math.max(1, ...sorted.map((r) => r.count));

  return (
    <section className="card p-6">
      <h2 className="text-[16px] font-extrabold text-ink">{title}</h2>
      <p className="text-[12.5px] text-muted">{subtitle}</p>
      <div className="mt-5 space-y-4">
        {sorted.length === 0 && <div className="text-[13px] text-muted">No data yet.</div>}
        {sorted.map((r, i) => (
          <div key={r.status} className="flex items-center gap-3">
            <div className="w-36 shrink-0 truncate text-[13px] font-semibold text-body">{titleCase(r.status)}</div>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-wash">
              <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }} />
            </div>
            <div className="w-10 shrink-0 text-right text-[14px] font-extrabold text-ink">{r.count}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
