'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, ApiError, type AuditEntry, type Capability, type PendingInvite, type PlatformRules, type Team, type TeamMember } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { nameFromEmail, relativeTime, roleFromCapabilities, titleCase } from '@/lib/format';

type Tab = 'account' | 'team' | 'notifications' | 'rules' | 'audit' | 'security';
const TABS: [Tab, string][] = [
  ['account', 'My account'],
  ['team', 'Team & Roles'],
  ['notifications', 'Notifications'],
  ['rules', 'Platform rules'],
  ['audit', 'Audit log'],
  ['security', 'Security'],
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('account');
  return (
    <div>
      <PageHeader crumb="Admin · Settings" title="Settings" subtitle="Your account, the team, platform rules and the audit trail." />

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-rule">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`relative whitespace-nowrap pb-3 text-[15px] font-semibold transition ${tab === k ? 'text-brand' : 'text-muted hover:text-ink'}`}
          >
            {label}
            {tab === k && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      {tab === 'account' && <AccountTab />}
      {tab === 'team' && <TeamTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'security' && <SecurityTab />}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-xl border border-rule bg-wash px-4 py-3 text-[12.5px] text-muted">{children}</p>;
}

function AccountTab() {
  const { user } = useAuth();
  const name = nameFromEmail(user?.email);
  const role = roleFromCapabilities(user?.capabilities);
  const rows: [string, string][] = [
    ['Display name', name],
    ['Email', user?.email ?? '—'],
    ['Phone', user?.phone_e164 ?? '—'],
    ['Role', role],
    ['Capabilities', user?.capabilities?.length ? user.capabilities.map(titleCase).join(' · ') : 'None'],
    ['Account status', titleCase(user?.status ?? 'active')],
  ];
  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-[16px] font-extrabold text-ink">My account</h2>
      <p className="text-[13px] text-muted">Your admin profile, from the authentication service.</p>
      <dl className="mt-4 divide-y divide-rule">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[13px] font-semibold text-muted">{k}</dt>
            <dd className="text-right text-[14px] font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <Note>Profile edits are managed by an administrator — this view is read-only.</Note>
    </div>
  );
}

const ROLE_CARDS = [
  { name: 'Super Admin', desc: 'Full access — users, campaigns, submissions, withdrawals, settings and more.' },
  { name: 'Campaign Reviewer', desc: 'Approves or rejects users and campaign content. No access to withdrawals or settings.' },
  { name: 'Finance', desc: 'Approves withdrawals and records campaign funding. No content-moderation access.' },
  { name: 'Support', desc: 'View-only across all queues. Cannot approve or reject anything.' },
];

const CAP_CATALOG: { value: Capability; label: string; desc: string }[] = [
  { value: 'REVIEW_EVIDENCE', label: 'Review evidence', desc: 'Approve/reject campaigns, promoters and proof.' },
  { value: 'RECORD_MONEY', label: 'Record money', desc: 'Fund campaigns and record payouts.' },
  { value: 'MANAGE_TEAM', label: 'Manage team', desc: 'Invite, edit and suspend admins.' },
];

function TeamTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['team'], queryFn: () => api.get<Team>('/v1/admin/team') });
  const { user } = useAuth();
  const canManage = !!user?.capabilities?.includes('MANAGE_TEAM');

  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['team'] });
  const onError = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Something went wrong.');

  const suspend = useMutation({ mutationFn: (id: string) => api.post(`/v1/admin/team/${id}/suspend`), onSuccess: () => { setError(null); invalidate(); }, onError });
  const reactivate = useMutation({ mutationFn: (id: string) => api.post(`/v1/admin/team/${id}/reactivate`), onSuccess: () => { setError(null); invalidate(); }, onError });
  const revoke = useMutation({ mutationFn: (id: string) => api.post(`/v1/admin/team/invites/${id}/revoke`), onSuccess: () => { setError(null); invalidate(); }, onError });

  const admins = q.data?.admins ?? [];
  const invites = q.data?.pending_invites ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_CARDS.map((r) => (
          <div key={r.name} className="card p-4">
            <div className="text-[14.5px] font-extrabold text-ink">{r.name}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{r.desc}</p>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-[13px] text-brand-700">{error}</div>}

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-extrabold text-ink">Team members</h2>
            <p className="text-[13px] text-muted">{admins.length} {admins.length === 1 ? 'person has' : 'people have'} admin access.</p>
          </div>
          {canManage && <Button onClick={() => setInviting(true)}>+ Invite</Button>}
        </div>

        {q.isLoading ? (
          <div className="flex h-32 items-center justify-center text-brand"><Spinner className="h-6 w-6" /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead className="border-b border-rule text-[12px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Capabilities</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((m) => {
                  const isYou = m.id === user?.id;
                  const suspended = m.status === 'SUSPENDED';
                  return (
                    <tr key={m.id} className="border-b border-rule last:border-0">
                      <td className="px-3 py-3">
                        <div className="font-bold text-ink">{nameFromEmail(m.email)}</div>
                        <div className="text-[12px] text-muted">{m.email}</div>
                      </td>
                      <td className="px-3 py-3 text-body">{m.capabilities.length ? m.capabilities.map((c) => titleCase(c.replace('_', ' '))).join(' · ') : 'None'}</td>
                      <td className="px-3 py-3"><StatusPill status={m.status} /></td>
                      <td className="px-3 py-3 text-right">
                        {isYou ? (
                          <span className="text-[13px] font-semibold text-brand-700">This is you</span>
                        ) : canManage ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setError(null); setEditing(m); }} className="text-[12.5px] font-semibold text-brand-700 hover:underline">Edit</button>
                            {suspended ? (
                              <button onClick={() => reactivate.mutate(m.id)} className="text-[12.5px] font-semibold text-ok hover:underline">Reactivate</button>
                            ) : (
                              <button onClick={() => suspend.mutate(m.id)} className="text-[12.5px] font-semibold text-brand-700 hover:underline">Suspend</button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[13px] text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {invites.length > 0 && (
          <div className="mt-6 border-t border-rule pt-4">
            <h3 className="text-[13.5px] font-bold text-ink">Pending invites</h3>
            <div className="mt-2 space-y-2">
              {invites.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rule px-3 py-2.5">
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{i.email}</div>
                    <div className="text-[12px] text-muted">{i.capabilities.map((c) => titleCase(c.replace('_', ' '))).join(' · ') || 'No capabilities'} · invited {relativeTime(i.created_at)}</div>
                  </div>
                  {canManage && <button onClick={() => revoke.mutate(i.id)} className="text-[12.5px] font-semibold text-brand-700 hover:underline">Revoke</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!canManage && <Note>You can view the team. Inviting, editing and suspending teammates requires the “Manage team” capability.</Note>}
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} onDone={() => { setInviting(false); invalidate(); }} onError={onError} />}
      {editing && <CapabilitiesModal member={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); invalidate(); }} onError={onError} />}
    </div>
  );
}

function CapabilityPicker({ selected, onToggle }: { selected: Capability[]; onToggle: (c: Capability) => void }) {
  return (
    <div className="space-y-2">
      {CAP_CATALOG.map((c) => {
        const on = selected.includes(c.value);
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onToggle(c.value)}
            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-brand bg-brand/5' : 'border-rule hover:border-ink/30'}`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-bold ${on ? 'bg-brand text-white' : 'border border-rule text-transparent'}`}>✓</span>
            <span>
              <span className="block text-[13.5px] font-semibold text-ink">{c.label}</span>
              <span className="block text-[12px] text-muted">{c.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InviteModal({ onClose, onDone, onError }: { onClose: () => void; onDone: () => void; onError: (e: unknown) => void }) {
  const [email, setEmail] = useState('');
  const [caps, setCaps] = useState<Capability[]>(['REVIEW_EVIDENCE']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toggle = (c: Capability) => setCaps((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function submit() {
    if (!/.+@.+\..+/.test(email)) return setErr('Enter a valid email.');
    if (caps.length === 0) return setErr('Pick at least one capability.');
    setBusy(true); setErr(null);
    try {
      await api.post('/v1/admin/team/invites', { email: email.trim().toLowerCase(), capabilities: caps });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not send the invite.');
      onError(e);
      setBusy(false);
    }
  }

  return (
    <Modal title="Invite a teammate" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teammate@ralia.co"
            className="w-full rounded-xl border border-rule bg-paper px-4 py-2.5 text-[14px] text-ink outline-none focus:border-brand" />
        </Field>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Capabilities</p>
          <CapabilityPicker selected={caps} onToggle={toggle} />
        </div>
        {err && <p className="text-[12.5px] text-brand-700">{err}</p>}
        <div className="flex gap-2.5 pt-1">
          <Button className="flex-1" loading={busy} onClick={submit}>Send invite</Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function CapabilitiesModal({ member, onClose, onDone, onError }: { member: TeamMember; onClose: () => void; onDone: () => void; onError: (e: unknown) => void }) {
  const [caps, setCaps] = useState<Capability[]>(member.capabilities);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toggle = (c: Capability) => setCaps((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function submit() {
    setBusy(true); setErr(null);
    try {
      await api.patch(`/v1/admin/team/${member.id}/capabilities`, { capabilities: caps });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not update capabilities.');
      onError(e);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Capabilities — ${nameFromEmail(member.email)}`} onClose={onClose}>
      <div className="space-y-4">
        <CapabilityPicker selected={caps} onToggle={toggle} />
        {err && <p className="text-[12.5px] text-brand-700">{err}</p>}
        <div className="flex gap-2.5 pt-1">
          <Button className="flex-1" loading={busy} onClick={submit}>Save</Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

const NOTIF_PREFS = [
  { key: 'promoter_queue', label: 'New promoter awaiting approval' },
  { key: 'campaign_queue', label: 'New campaign submitted for review' },
  { key: 'withdrawal_queue', label: 'New withdrawal requested' },
  { key: 'submission_queue', label: 'New proof submitted' },
  { key: 'reconciliation', label: 'Settlement mismatch flagged' },
];
const NOTIF_KEY = 'ralia.admin.notif-prefs';

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setPrefs(JSON.parse(localStorage.getItem(NOTIF_KEY) ?? '{}')); } catch { setPrefs({}); }
  }, []);
  const toggle = (key: string) => setPrefs((p) => {
    const next = { ...p, [key]: !(p[key] ?? true) };
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    return next;
  });
  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-[16px] font-extrabold text-ink">Notifications</h2>
      <p className="text-[13px] text-muted">Which queue events surface a heads-up for you.</p>
      <div className="mt-4 divide-y divide-rule">
        {NOTIF_PREFS.map((n) => {
          const on = prefs[n.key] ?? true;
          return (
            <div key={n.key} className="flex items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] font-semibold text-ink">{n.label}</span>
              <button
                onClick={() => toggle(n.key)}
                role="switch"
                aria-checked={on}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-rule'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          );
        })}
      </div>
      <Note>Saved on this device.</Note>
    </div>
  );
}

const FIELDS: { key: keyof PlatformRules; label: string; hint: string }[] = [
  { key: 'take_rate_pct', label: 'Take rate (%)', hint: 'Ralia’s cut of each slot (the rest is the promoter’s).' },
  { key: 'rpm_distribution_minor', label: 'Distribution RPM (kobo / 1,000)', hint: 'Price per 1,000 effective views for distribution campaigns.' },
  { key: 'rpm_creation_minor', label: 'Creation RPM (kobo / 1,000)', hint: 'Price per 1,000 effective views for creation/participation campaigns.' },
  { key: 'floor_distribution_minor', label: 'Distribution floor (kobo)', hint: 'Minimum campaign fee for a distribution campaign.' },
  { key: 'floor_creation_minor', label: 'Creation floor (kobo)', hint: 'Minimum campaign fee for a creation/participation campaign.' },
  { key: 'default_promoters_distribution', label: 'Distribution default promoters', hint: 'Slot count the wizard pre-fills for distribution.' },
  { key: 'default_promoters_creation', label: 'Creation default promoters', hint: 'Slot count the wizard pre-fills for creation.' },
  { key: 'default_reach_distribution', label: 'Distribution default reach', hint: 'Reach per slot the wizard pre-fills for distribution.' },
  { key: 'default_reach_creation', label: 'Creation default reach', hint: 'Reach per slot the wizard pre-fills for creation.' },
  { key: 'rpm_minor', label: 'Legacy RPM (kobo / 1,000)', hint: 'Fallback rate for any campaign without a category.' },
  { key: 'delivery_threshold_pct', label: 'Delivery threshold τ (%)', hint: 'Below this share of promised, a proof is rejected.' },
  { key: 'unverified_reach_cap', label: 'Unverified reach cap', hint: 'Self-reported reach ceiling until verified.' },
  { key: 'proof_validity_days', label: 'Proof validity (days)', hint: 'How long a verification lasts before it decays.' },
  { key: 'min_trust_score', label: 'Min trust to match', hint: 'Promoters below this are filtered out.' },
  { key: 'offer_expiry_hours', label: 'Offer window (hours)', hint: 'How long an offer stays open.' },
  { key: 'delivery_window_hours', label: 'Delivery window (hours)', hint: 'Deadline for campaigns with no fixed end date.' },
  { key: 'contingency_buffer_hours', label: 'Contingency buffer (hours)', hint: 'Promoter deadlines sit this far before the client run-window end, leaving room to reclaim a missed slot.' },
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
    <div className="card max-w-3xl p-6">
      <h2 className="text-[16px] font-extrabold text-ink">Platform rules</h2>
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13.5px]">
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
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-[16px] font-extrabold text-ink">Security</h2>
      <p className="text-[13px] text-muted">Keep your admin account safe.</p>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rule p-4">
          <div>
            <div className="text-[14px] font-semibold text-ink">Password</div>
            <div className="text-[12.5px] text-muted">Change the password you use to sign in.</div>
          </div>
          <Button variant="secondary" disabled title="Password change ships with the account API">Change</Button>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rule p-4">
          <div>
            <div className="text-[14px] font-semibold text-ink">Two-factor authentication</div>
            <div className="text-[12.5px] text-muted">Add a second step when signing in.</div>
          </div>
          <Button variant="secondary" disabled title="2FA ships with the account API">Enable</Button>
        </div>
      </div>
      <Note>These controls are wired to the UI; the account-security API is not yet available.</Note>
    </div>
  );
}
