'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/Spinner';
import { api, type PlatformAnalytics, type StatusCount } from '@/lib/api';
import { compactNumber, titleCase } from '@/lib/format';

export default function AnalyticsPage() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: () => api.get<PlatformAnalytics>('/v1/admin/analytics') });

  if (q.isLoading || !q.data) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const a = q.data;

  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Overview</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Performance</h1>
        <p className="mt-1 text-[14px] text-muted">How the marketplace is doing right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="GMV (funded)" value={a.gmv.amount_display} accent />
        <Metric label={`Revenue · ${a.take_rate_pct}% take`} value={a.revenue.amount_display} />
        <Metric label="Live campaigns" value={String(a.live_campaigns)} />
        <Metric label="Active promoters" value={compactNumber(a.active_promoters)} sub={`${a.active_clients} active clients`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Breakdown title="Promoters by status" rows={a.promoters_by_status} />
        <Breakdown title="Campaigns by status" rows={a.campaigns_by_status} />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] font-semibold text-muted">{label}</div>
      <div className={`mt-1 text-[24px] font-extrabold ${accent ? 'text-brand' : 'text-ink'}`}>{value}</div>
      {sub && <div className="text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: StatusCount[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  const sorted = [...rows].sort((x, y) => y.count - x.count);
  return (
    <section className="card p-5">
      <h2 className="text-[15px] font-extrabold text-ink">{title}</h2>
      <div className="mt-3 space-y-2.5">
        {sorted.length === 0 && <div className="text-[13px] text-muted">No data yet.</div>}
        {sorted.map((r) => (
          <div key={r.status}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-body">{titleCase(r.status)}</span>
              <span className="font-semibold text-ink">{r.count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-wash">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(3, (r.count / total) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
