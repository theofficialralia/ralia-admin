'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, type CategorySpend, type PlatformAnalytics, type RolePerformance, type StatusCount } from '@/lib/api';
import { compactNumber, titleCase } from '@/lib/format';

export default function AnalyticsPage() {
  const q = useQuery({ queryKey: ['analytics'], queryFn: () => api.get<PlatformAnalytics>('/v1/admin/analytics') });

  if (q.isLoading || !q.data) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const a = q.data;

  return (
    <div>
      <PageHeader title="Performance analytics" subtitle="How the marketplace is doing right now — what to scale back or intensify on." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total GMV (funded)" value={a.gmv.amount_display} accent="brand" sub="Client spend taken live" />
        <StatCard label="Revenue / commissions" value={a.revenue.amount_display} accent="ok" delta={`${a.take_rate_pct}% take rate`} deltaTone="muted" />
        <StatCard label="Live campaigns" value={String(a.live_campaigns)} accent="warn" />
        <StatCard label="Active promoters" value={compactNumber(a.active_promoters)} accent="ink" />
        <StatCard label="Active clients" value={compactNumber(a.active_clients)} accent="ink" />
      </div>

      <SpendByCategory rows={a.spend_by_category} />

      <div className="mt-5">
        <PromoterPerformance rows={a.promoter_performance} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StatusCard title="Promoters by status" subtitle="Across the whole marketplace" rows={a.promoters_by_status} />
        <StatusCard title="Campaigns by status" subtitle="Across the whole marketplace" rows={a.campaigns_by_status} />
      </div>
    </div>
  );
}

/** Client spend grouped by industry — where the GMV is coming from. */
function SpendByCategory({ rows }: { rows: CategorySpend[] }) {
  const max = Math.max(1, ...rows.map((r) => r.spend.amount_minor));
  return (
    <section className="card p-6">
      <h2 className="text-[16px] font-extrabold text-ink">Spend by category</h2>
      <p className="text-[12.5px] text-muted">Funded client spend by industry — current period</p>
      <div className="mt-5 space-y-3.5">
        {rows.length === 0 && <div className="text-[13px] text-muted">No funded spend yet.</div>}
        {rows.map((r) => (
          <div key={r.category} className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-[13.5px] font-semibold text-body">{r.category}</div>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand/10">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (r.spend.amount_minor / max) * 100)}%` }} />
            </div>
            <div className="w-20 shrink-0 text-right text-[13.5px] font-extrabold tabular-nums text-ink">{r.spend.amount_display}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Per-role colour + label, matching the legend. */
const ROLE_STYLE: Record<string, { label: string; bar: string; track: string; dot: string }> = {
  CREATOR: { label: 'Creators', bar: 'bg-brand', track: 'bg-brand/10', dot: 'bg-brand' },
  DISTRIBUTOR: { label: 'Distributors', bar: 'bg-ok', track: 'bg-ok/10', dot: 'bg-ok' },
  PARTICIPATOR: { label: 'Participators', bar: 'bg-ink/80', track: 'bg-ink/10', dot: 'bg-ink/80' },
  INFLUENCER: { label: 'Influencers', bar: 'bg-warn', track: 'bg-warn/15', dot: 'bg-warn' },
};

function roleStyle(role: string) {
  return ROLE_STYLE[role] ?? { label: titleCase(role), bar: 'bg-ink/60', track: 'bg-ink/10', dot: 'bg-ink/60' };
}

/** Earnings and campaign volume per promoter role — approved/paid work. */
function PromoterPerformance({ rows }: { rows: RolePerformance[] }) {
  const max = Math.max(1, ...rows.map((r) => r.earnings.amount_minor));
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-extrabold text-ink">Promoter’s performance</h2>
          <p className="text-[12.5px] text-muted">Fees earned and campaigns delivered, by role</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[12px] font-semibold text-body">
          {rows.map((r) => {
            const st = roleStyle(r.role);
            return (
              <span key={r.role} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} /> {st.label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {rows.length === 0 && <div className="text-[13px] text-muted">No approved promoter work yet.</div>}
        {rows.map((r) => {
          const st = roleStyle(r.role);
          return (
            <div key={r.role} className="flex items-center gap-3">
              <div className="w-28 shrink-0 truncate text-[13.5px] font-semibold text-body">{st.label}</div>
              <div className={`h-3 flex-1 overflow-hidden rounded-full ${st.track}`}>
                <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${Math.max(4, (r.earnings.amount_minor / max) * 100)}%` }} />
              </div>
              <div className="w-44 shrink-0 text-right text-[13px] tabular-nums text-ink">
                <span className="font-extrabold">{r.earnings.amount_display}</span>
                <span className="text-muted"> from {r.campaigns.toLocaleString('en-NG')} campaign{r.campaigns === 1 ? '' : 's'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Palette cycled across status rows. */
const BAR_COLORS = ['bg-brand', 'bg-brand-700', 'bg-ink/70', 'bg-ok', 'bg-warn'];

function StatusCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: StatusCount[] }) {
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
