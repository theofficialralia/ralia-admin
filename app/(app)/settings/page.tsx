'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { api, type AuditEntry, type PlatformRules, type TeamMember } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { relativeTime, titleCase } from '@/lib/format';

export default function SettingsPage() {
  const [tab, setTab] = useState<'rules' | 'audit' | 'team'>('rules');
  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Admin · Settings</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-[14px] text-muted">Platform rules, the audit trail, and who has admin access.</p>
      </div>

      <div className="mb-5 inline-flex rounded-full border border-rule bg-paper p-1 text-[14px] font-semibold">
        {([['rules', 'Platform rules'], ['audit', 'Audit log'], ['team', 'Team & roles']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-5 py-1.5 transition ${tab === k ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{label}</button>
        ))}
      </div>

      {tab === 'rules' ? <RulesTab /> : tab === 'audit' ? <AuditTab /> : <TeamTab />}
    </div>
  );
}

const FIELDS: { key: keyof PlatformRules; label: string; hint: string }[] = [
  { key: 'take_rate_pct', label: 'Take rate (%)', hint: 'Ralia’s cut of each slot.' },
  { key: 'rpm_minor', label: 'RPM (kobo / 1,000 views)', hint: 'Base price per 1,000 effective views.' },
  { key: 'delivery_threshold_pct', label: 'Delivery threshold τ (%)', hint: 'Below this share of promised, a proof is rejected.' },
  { key: 'unverified_reach_cap', label: 'Unverified reach cap', hint: 'Self-reported reach ceiling until verified.' },
  { key: 'proof_validity_days', label: 'Proof validity (days)', hint: 'How long a verification lasts before it decays.' },
  { key: 'min_trust_score', label: 'Min trust to match', hint: 'Promoters below this are filtered out.' },
  { key: 'offer_expiry_hours', label: 'Offer window (hours)', hint: 'How long an offer stays open.' },
  { key: 'withdrawal_minimum_minor', label: 'Min withdrawal (kobo)', hint: 'Smallest payout a promoter can request.' },
];

function RulesTab() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const canEdit = can('RECORD_MONEY');
  const q = useQuery({ queryKey: ['rate-config'], queryFn: () => api.get<PlatformRules>('/v1/admin/rate-config') });
  const [draft, setDraft] = useState<PlatformRules | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (q.data) setDraft(q.data); }, [q.data]);

  const save = useMutation({
    mutationFn: (body: PlatformRules) => api.patch<PlatformRules>('/v1/admin/rate-config', body),
    onSuccess: (fresh) => { setDraft(fresh); setSaved(true); void qc.invalidateQueries({ queryKey: ['rate-config'] }); },
  });

  if (q.isLoading || !draft) return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;

  return (
    <div className="card max-w-2xl p-6">
      <p className="mb-4 text-[13px] text-muted">Changing these never reprices a campaign that already quoted — it only affects new quotes and matches.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <input
              type="number"
              className="input"
              disabled={!canEdit}
              value={draft[f.key]}
              onChange={(e) => { setSaved(false); setDraft({ ...draft, [f.key]: Math.max(0, Number(e.target.value)) }); }}
            />
          </Field>
        ))}
      </div>
      {canEdit ? (
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => save.mutate(draft)} loading={save.isPending}>Save changes</Button>
          {saved && <span className="text-[13px] text-ok">Saved.</span>}
        </div>
      ) : (
        <p className="mt-6 text-[13px] text-muted">You need the record-money capability to change these.</p>
      )}
    </div>
  );
}

function AuditTab() {
  const q = useQuery({ queryKey: ['audit-log'], queryFn: () => api.get<AuditEntry[]>('/v1/admin/audit-log') });
  if (q.isLoading) return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const rows = q.data ?? [];
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-[13.5px]">
        <thead className="border-b border-rule text-[12px] font-semibold uppercase tracking-wide text-muted">
          <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No activity yet.</td></tr>}
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-rule last:border-0">
              <td className="px-4 py-3 text-muted">{relativeTime(a.created_at)}</td>
              <td className="px-4 py-3 text-ink">{a.actor}</td>
              <td className="px-4 py-3 font-semibold text-ink">{titleCase(a.action.replace(/\./g, ' '))}</td>
              <td className="px-4 py-3 text-muted">{a.entity_type}{a.reason ? ` · ${a.reason}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamTab() {
  const q = useQuery({ queryKey: ['team'], queryFn: () => api.get<TeamMember[]>('/v1/admin/team') });
  if (q.isLoading) return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const team = q.data ?? [];
  return (
    <div className="space-y-2.5">
      {team.map((m) => (
        <div key={m.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-[14px] font-bold text-ink">{m.email}</div>
            <div className="text-[12px] text-muted">{m.capabilities.length ? m.capabilities.map((c) => titleCase(c)).join(' · ') : 'No capabilities'}</div>
          </div>
          <StatusPill status={m.status} />
        </div>
      ))}
    </div>
  );
}
