'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ReasonModal } from '@/components/ui/ReasonModal';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { api, uuid, type ExposureReport, type GatewayPayment, type PendingWithdrawal, type ReconciliationReport } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { relativeTime } from '@/lib/format';

export default function FinancePage() {
  const [tab, setTab] = useState<'withdrawals' | 'reconciliation'>('withdrawals');
  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Queue · Money</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Finance</h1>
        <p className="mt-1 text-[14px] text-muted">Approve and record promoter payouts, and reconcile gateway settlements.</p>
      </div>

      <div className="mb-4 inline-flex rounded-full border border-rule bg-paper p-1 text-[14px] font-semibold">
        {(['withdrawals', 'reconciliation'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-1.5 capitalize transition ${tab === t ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'withdrawals' ? <WithdrawalsTab /> : <ReconciliationTab />}
    </div>
  );
}

function WithdrawalsTab() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const canMoney = can('RECORD_MONEY');
  const [paying, setPaying] = useState<PendingWithdrawal | null>(null);
  const [failing, setFailing] = useState<PendingWithdrawal | null>(null);

  const q = useQuery({ queryKey: ['withdrawals'], queryFn: () => api.get<PendingWithdrawal[]>('/v1/admin/queues/withdrawals') });
  const exposure = useQuery({ queryKey: ['exposure'], queryFn: () => api.get<ExposureReport>('/v1/admin/finance/exposure') });
  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['withdrawals'] }); void qc.invalidateQueries({ queryKey: ['exposure'] }); void qc.invalidateQueries({ queryKey: ['nav-counts'] }); };
  const approve = useMutation({ mutationFn: (id: string) => api.post(`/v1/admin/withdrawals/${id}/approve`, {}), onSuccess: invalidate });
  const verifyKyc = useMutation({ mutationFn: (promoterId: string) => api.post(`/v1/admin/promoters/${promoterId}/kyc`, { status: 'VERIFIED' }), onSuccess: invalidate });

  if (q.isLoading) return <Loading />;
  const items = q.data ?? [];

  return (
    <div className="space-y-4">
      {exposure.data && <ExposureCard e={exposure.data} />}

      {items.length === 0 ? (
        <Empty title="No payouts waiting" sub="Requested and approved withdrawals appear here." />
      ) : (
        <div className="space-y-2.5">
          {items.map((w) => {
            const kycOk = w.kyc_status === 'VERIFIED';
            return (
              <div key={w.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={w.promoter_name} />
                  <div>
                    <div className="text-[14px] font-bold text-ink">{w.promoter_name ?? 'Unnamed'}</div>
                    <div className="text-[12px] text-muted">{w.bank.account_name} · {w.bank.bank_code} ··{w.bank.last4} · {relativeTime(w.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${kycOk ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>KYC {w.kyc_status}</span>
                  <div className="text-[16px] font-extrabold text-ink">{w.amount.amount_display}</div>
                  <StatusPill status={w.status} />
                  {canMoney && (
                    <>
                      {!kycOk && can('REVIEW_EVIDENCE') && (
                        <Button size="sm" variant="secondary" onClick={() => verifyKyc.mutate(w.promoter_id)} loading={verifyKyc.isPending && verifyKyc.variables === w.promoter_id}>Verify KYC</Button>
                      )}
                      {w.status === 'REQUESTED'
                        ? <Button size="sm" onClick={() => approve.mutate(w.id)} loading={approve.isPending} disabled={!kycOk}>Approve</Button>
                        : <Button size="sm" onClick={() => setPaying(w)}>Record paid</Button>}
                      <Button size="sm" variant="danger" onClick={() => setFailing(w)}>Fail</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {paying && <RecordPaidModal withdrawal={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); invalidate(); }} />}
      {failing && <FailModal withdrawal={failing} onClose={() => setFailing(null)} onDone={() => { setFailing(null); invalidate(); }} />}
    </div>
  );
}

function ExposureCard({ e }: { e: ExposureReport }) {
  const cells: [string, string][] = [
    ['Owed to promoters', e.promoter_payable.amount_display],
    ['In-flight payouts', e.in_flight_withdrawals.amount_display],
    ['Escrow held', e.escrow_held.amount_display],
    ['Platform revenue', e.platform_revenue.amount_display],
  ];
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Exposure</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${e.fully_backed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-brand/10 text-brand-700'}`}>
          {e.fully_backed ? 'Fully backed' : 'Check balances'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cells.map(([label, value]) => (
          <div key={label}>
            <div className="text-[11px] text-muted">{label}</div>
            <div className="text-[15px] font-extrabold text-ink">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FailModal({ withdrawal, onClose, onDone }: { withdrawal: PendingWithdrawal; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try {
      await api.post(`/v1/admin/withdrawals/${withdrawal.id}/fail`, { reason });
      onDone();
    } catch { setError('Could not fail the withdrawal.'); setBusy(false); }
  }
  return (
    <Modal title="Fail this withdrawal" onClose={onClose}>
      <p className="text-[13.5px] text-muted">The promoter’s balance is untouched — nothing was posted. They can request it again.</p>
      <Field label="Reason (shown to the promoter)">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bank details don’t match the account name" />
      </Field>
      {error && <p className="mt-2 text-[12px] text-brand-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={submit} loading={busy} disabled={reason.trim().length < 5}>Fail withdrawal</Button>
      </div>
    </Modal>
  );
}

function RecordPaidModal({ withdrawal, onClose, onDone }: { withdrawal: PendingWithdrawal; onClose: () => void; onDone: () => void }) {
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try {
      await api.post(`/v1/admin/withdrawals/${withdrawal.id}/record-paid`, { paid_ref: ref }, { idempotencyKey: uuid() });
      onDone();
    } catch { setError('Could not record the payout.'); setBusy(false); }
  }
  return (
    <Modal title="Record the payout you sent" onClose={onClose}>
      <p className="text-[13.5px] text-muted">Posts DR promoter-balance / CR bank-clearing for {withdrawal.amount.amount_display}.</p>
      <Field label="Transfer reference">
        <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. Zenith transfer 552117" />
      </Field>
      {error && <p className="mt-2 text-[12px] text-brand-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={submit} loading={busy} disabled={ref.trim().length < 3}>Record</Button>
      </div>
    </Modal>
  );
}

function ReconciliationTab() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const canMoney = can('RECORD_MONEY');
  const [settling, setSettling] = useState<GatewayPayment | null>(null);
  const [flagging, setFlagging] = useState<GatewayPayment | null>(null);

  const q = useQuery({ queryKey: ['reconciliation'], queryFn: () => api.get<ReconciliationReport>('/v1/admin/reconciliation') });
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['reconciliation'] });
  const flag = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/v1/admin/reconciliation/${id}/flag`, { reason }), onSuccess: () => { setFlagging(null); invalidate(); } });

  if (q.isLoading) return <Loading />;
  const r = q.data;
  if (!r) return <Empty title="No gateway charges" sub="Paystack-funded campaigns appear here for settlement." />;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Gateway total" value={r.gateway_total.amount_display} />
        <Metric label="Settled" value={r.settled_total.amount_display} />
        <Metric label="Awaiting" value={String(r.recorded)} />
        <Metric label="Ledger match" value={r.ledger_matches_gateway ? 'Balanced' : 'Mismatch'} tone={r.ledger_matches_gateway ? 'ok' : 'brand'} />
      </div>

      {r.payments.length === 0 ? (
        <Empty title="Nothing to reconcile" sub="No gateway charges recorded yet." />
      ) : (
        <div className="space-y-2.5">
          {r.payments.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
                  {p.reference}
                  {!p.matched && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand-700">ledger ≠ gateway</span>}
                </div>
                <div className="text-[12px] text-muted">gateway {p.gateway.amount_display} · ledger {p.ledger.amount_display}{p.settled ? ` · settled ${p.settled.amount_display}` : ''}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={p.status} />
                {canMoney && p.status === 'RECORDED' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setFlagging(p)}>Flag</Button>
                    <Button size="sm" onClick={() => setSettling(p)}>Settle</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {settling && <SettleModal payment={settling} onClose={() => setSettling(null)} onDone={() => { setSettling(null); invalidate(); }} />}
      {flagging && <ReasonModal title="Flag a settlement discrepancy?" placeholder="e.g. Paystack settled short beyond the fee." confirmLabel="Flag" pending={flag.isPending} onClose={() => setFlagging(null)} onConfirm={(reason) => flag.mutate({ id: flagging.id, reason })} />}
    </div>
  );
}

function SettleModal({ payment, onClose, onDone }: { payment: GatewayPayment; onClose: () => void; onDone: () => void }) {
  const [ref, setRef] = useState('');
  const [settled, setSettled] = useState<number>(payment.gateway.amount_minor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try {
      await api.post(`/v1/admin/reconciliation/${payment.id}/settle`, { settlement_ref: ref, settled_minor: settled });
      onDone();
    } catch { setError('Could not record the settlement.'); setBusy(false); }
  }
  return (
    <Modal title="Confirm settlement" onClose={onClose}>
      <p className="text-[13.5px] text-muted">Record that this charge settled. The amount is net of gateway fees.</p>
      <Field label="Settlement reference">
        <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. PSTK_STL_20260803" />
      </Field>
      <Field label="Amount settled (kobo)">
        <input type="number" className="input" value={settled} onChange={(e) => setSettled(Math.max(0, Number(e.target.value)))} />
      </Field>
      {error && <p className="mt-2 text-[12px] text-brand-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={submit} loading={busy} disabled={ref.trim().length < 3}>Confirm settled</Button>
      </div>
    </Modal>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'brand' }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'brand' ? 'text-brand-700' : 'text-ink';
  return (
    <div className="card p-4">
      <div className={`text-[18px] font-extrabold ${color}`}>{value}</div>
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function Loading() {
  return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
}
function Empty({ title, sub }: { title: string; sub: string }) {
  return <div className="card grid place-items-center p-14 text-center text-muted"><div className="text-[15px] font-semibold text-ink">{title}</div><div className="mt-1 text-[13.5px]">{sub}</div></div>;
}
