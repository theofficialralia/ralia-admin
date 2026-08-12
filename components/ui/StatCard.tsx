/**
 * KPI stat card matching the admin design: a white card with a soft corner
 * "watermelon" accent and an optional delta line under the value. Used to lead
 * the list pages (Promoters, Finance, Performance).
 */
type Accent = 'brand' | 'ok' | 'warn' | 'ink';

const ACCENTS: Record<Accent, { ring: string; dot: string; value: string }> = {
  brand: { ring: 'from-brand/25', dot: 'bg-brand', value: 'text-ink' },
  ok: { ring: 'from-ok/25', dot: 'bg-ok', value: 'text-ink' },
  warn: { ring: 'from-warn/25', dot: 'bg-warn', value: 'text-ink' },
  ink: { ring: 'from-ink/15', dot: 'bg-ink/70', value: 'text-ink' },
};

export function StatCard({
  label,
  value,
  sub,
  delta,
  deltaTone = 'muted',
  accent = 'brand',
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'muted';
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  const deltaColor = deltaTone === 'up' ? 'text-ok' : deltaTone === 'down' ? 'text-brand-700' : 'text-muted';
  return (
    <div className="card relative overflow-hidden p-5">
      {/* corner accent */}
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${a.ring} to-transparent`} />
      <div className={`pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${a.dot} opacity-80`} />
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className={`mt-1.5 text-[26px] font-extrabold leading-none tracking-tight ${a.value}`}>{value}</div>
      {delta ? <div className={`mt-1.5 text-[12px] font-semibold ${deltaColor}`}>{delta}</div> : sub ? <div className="mt-1.5 text-[12px] text-muted">{sub}</div> : null}
    </div>
  );
}
