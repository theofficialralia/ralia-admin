'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, type CategorySpend, type DayRevenue, type PlatformAnalytics, type RolePerformance, type StatusCount } from '@/lib/api';
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

      <div className="grid gap-5 lg:grid-cols-2">
        <WeeklyRevenue rows={a.weekly_revenue} />
        <SpendByCategory rows={a.spend_by_category} />
      </div>

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

/** Compact naira from a minor-unit amount, e.g. 630000000 → ₦6.3M. */
function nairaCompact(minor: number): string {
  const n = minor / 100;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
}

/** Grouped daily bars: Revenue (funded) vs Profit (commission), last 7 days. */
function WeeklyRevenue({ rows }: { rows: DayRevenue[] }) {
  const H = 200;
  const max = Math.max(1, ...rows.flatMap((r) => [r.revenue.amount_minor, r.profit.amount_minor]));
  const ticks = [max, (max * 2) / 3, max / 3, 0];
  const barPct = (minor: number) => (minor <= 0 ? 0 : Math.max(2, (minor / max) * 100));

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-extrabold text-ink">Weekly Revenue vs commissions</h2>
          <p className="text-[12.5px] text-muted">Funded revenue vs profit — last 7 days</p>
        </div>
        <div className="flex items-center gap-4 text-[12px] font-semibold text-body">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Revenue</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" /> Profit</span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        {/* Y axis */}
        <div className="flex flex-col justify-between py-0.5 text-right text-[10.5px] tabular-nums text-muted" style={{ height: H }}>
          {ticks.map((t, i) => <div key={i}>{nairaCompact(t)}</div>)}
        </div>
        {/* Plot */}
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((_, i) => <div key={i} className="border-t border-rule/60" />)}
          </div>
          <div className="relative flex items-end justify-between gap-2" style={{ height: H }}>
            {rows.map((d) => (
              <div key={d.date} className="flex h-full flex-1 items-end justify-center gap-1">
                <div className="w-3 rounded-t bg-brand" style={{ height: `${barPct(d.revenue.amount_minor)}%` }} title={`Revenue ${d.revenue.amount_display}`} />
                <div className="w-3 rounded-t bg-ink" style={{ height: `${barPct(d.profit.amount_minor)}%` }} title={`Profit ${d.profit.amount_display}`} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-medium text-muted">
            {rows.map((d) => <div key={d.date} className="flex-1 text-center">{d.day}</div>)}
          </div>
        </div>
      </div>
    </section>
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
