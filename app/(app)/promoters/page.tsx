'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, type AdminChannel, type AdminPromoter, type PendingPromoter, type PlatformAnalytics, type PromoterFull } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compactNumber, relativeTime, titleCase } from '@/lib/format';

/** Capability band, matching the backend §7 tiers. */
function capabilityTier(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Established';
  if (score >= 40) return 'Developing';
  return 'Emerging';
}

function statusTotal(rows: { status: string; count: number }[] | undefined, ...match: string[]) {
  if (!rows) return null;
  return rows.filter((r) => match.includes(r.status.toUpperCase())).reduce((s, r) => s + r.count, 0);
}

export default function PromotersPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'queue' | 'directory'>('queue');

  const q = useQuery({
    queryKey: ['promoters'],
    queryFn: () => api.get<PendingPromoter[]>('/v1/admin/queues/promoters'),
  });
  const stats = useQuery({ queryKey: ['analytics'], queryFn: () => api.get<PlatformAnalytics>('/v1/admin/analytics') });

  const promoters = q.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return promoters;
    return promoters.filter((p) => (p.full_name ?? '').toLowerCase().includes(term) || p.email.toLowerCase().includes(term) || p.phone_e164.includes(term));
  }, [promoters, search]);
  const current = filtered.find((p) => p.user_id === selected) ?? filtered[0] ?? null;

  const s = stats.data?.promoters_by_status;
  const approved = statusTotal(s, 'ACTIVE');
  const pending = statusTotal(s, 'AWAITING_APPROVAL', 'PENDING') ?? promoters.length;
  const rejected = statusTotal(s, 'REJECTED');
  const total = s ? s.reduce((a, r) => a + r.count, 0) : null;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['promoters'] });
    void qc.invalidateQueries({ queryKey: ['analytics'] });
    void qc.invalidateQueries({ queryKey: ['nav-counts'] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/v1/admin/promoters/${id}/approve`, {}),
    onSuccess: () => { setSelected(null); invalidate(); },
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/v1/admin/promoters/${id}/reject`, { reason }),
    onSuccess: () => { setRejecting(false); setSelected(null); invalidate(); },
  });

  if (q.isLoading) {
    return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  }

  return (
    <div>
      <PageHeader
        crumb="Queue · Users"
        title="Approve promoters"
        subtitle="A promoter sees no offers until you approve them. Check that the reach evidence matches what they claimed."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total promoters" value={total != null ? compactNumber(total) : '—'} accent="ink" />
        <StatCard label="Approved" value={approved != null ? compactNumber(approved) : '—'} accent="ok" />
        <StatCard label="Pending" value={compactNumber(pending)} accent="warn" />
        <StatCard label="Rejected" value={rejected != null ? compactNumber(rejected) : '—'} accent="brand" />
      </div>

      <div className="mb-5 inline-flex rounded-full bg-wash p-1 text-[13.5px] font-semibold">
        <button onClick={() => setView('queue')} className={`rounded-full px-5 py-1.5 transition ${view === 'queue' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
          Awaiting approval{promoters.length ? ` · ${compactNumber(promoters.length)}` : ''}
        </button>
        <button onClick={() => setView('directory')} className={`rounded-full px-5 py-1.5 transition ${view === 'directory' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
          All promoters
        </button>
      </div>

      {view === 'directory' && <PromoterDirectory canReview={can('REVIEW_EVIDENCE')} />}

      {view === 'queue' && (promoters.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-muted">
          <div className="text-[15px] font-semibold text-ink">Nothing waiting</div>
          <div className="mt-1 text-[13.5px]">The approval queue is empty.</div>
        </div>
      ) : (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Search for a promoter" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
            {/* Master list */}
            <div className="space-y-2.5">
              {filtered.map((p) => (
                <button
                  key={p.user_id}
                  onClick={() => setSelected(p.user_id)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition ${
                    current?.user_id === p.user_id ? 'border-brand bg-brand/5 shadow-sm' : 'border-rule bg-paper hover:bg-wash'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={p.full_name} className="h-11 w-11 text-[14px]" />
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-bold text-ink">{p.full_name ?? 'Unnamed'}</div>
                      <div className="truncate text-[12px] text-muted">{p.phone_e164} · {p.location_state ?? '—'}</div>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="rounded-2xl border border-rule p-4 text-center text-[13px] text-muted">No match.</div>}
            </div>

            {/* Detail */}
            {current && (
              <PromoterDetail
                promoter={current}
                canReview={can('REVIEW_EVIDENCE')}
                onApprove={() => approve.mutate(current.user_id)}
                onReject={() => setRejecting(true)}
                approving={approve.isPending}
                onChanged={invalidate}
              />
            )}
          </div>
        </>
      ))}

      {rejecting && current && (
        <RejectModal name={current.full_name} pending={reject.isPending} error={reject.error} onClose={() => setRejecting(false)} onConfirm={(reason) => reject.mutate({ id: current.user_id, reason })} />
      )}
    </div>
  );
}

function PromoterDetail({
  promoter,
  canReview,
  onApprove,
  onReject,
  approving,
  onChanged,
}: {
  promoter: PendingPromoter;
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<'channels' | 'details'>('channels');

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={promoter.full_name} className="h-12 w-12 text-[16px]" />
          <div>
            <div className="text-[19px] font-extrabold text-ink">{promoter.full_name ?? 'Unnamed'}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
              <span>📱 {promoter.phone_e164}</span>
              <span>📍 {promoter.location_state ?? '—'}</span>
              <span>✉ {promoter.email}</span>
            </div>
          </div>
        </div>
        {canReview && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={onReject}>✕ Reject promoter</Button>
            <Button onClick={onApprove} loading={approving}>Accept</Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-5 inline-flex w-full rounded-2xl bg-wash p-1 text-[14px] font-semibold sm:w-auto">
        {([['channels', `Channels · ${promoter.channels.length}`], ['details', 'Other details']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-xl px-6 py-2 transition sm:flex-none ${tab === k ? 'bg-paper text-brand shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'channels' ? (
        <div className="mt-4">
          <p className="mb-3 text-[12.5px] text-muted">Effective reach is what Ralia pays on. Verify a channel to lift it above the self-reported cap.</p>
          <div className="space-y-3">
            {promoter.channels.length === 0 && <div className="rounded-xl border border-rule p-4 text-[13px] text-muted">No channels submitted.</div>}
            {promoter.channels.map((c) => (
              <ChannelRow key={c.id} channel={c} canReview={canReview} onChanged={onChanged} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Trust score" value={`${promoter.trust_score}/100`} />
            <MiniStat label="Roles offered" value={String(promoter.roles.length)} />
            <MiniStat label="Channels" value={String(promoter.channels.length)} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-ink">Capability</div>
            <p className="mb-3 text-[12.5px] text-muted">
              Each role carries a <span className="font-semibold text-ink">0–100 score</span> — how well-suited this promoter is to that kind of
              work, computed from what they told us and their verified reach. The label is the band it falls in
              (Emerging &lt;40 · Developing 40–59 · Established 60–79 · Elite 80+). Approving confirms it.
            </p>
            {promoter.roles.length === 0 ? (
              <div className="rounded-xl border border-rule p-4 text-[13px] text-muted">No roles selected yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {promoter.roles.map((role) => {
                  const score = promoter.capability_preview[role] ?? 0;
                  return (
                    <div key={role} className="rounded-xl border border-rule px-3.5 py-2" title={`${titleCase(role)} capability: ${score}/100 (${capabilityTier(score)})`}>
                      <div className="text-[12px] font-semibold text-ink">{titleCase(role)}</div>
                      <div className="text-[15px] font-extrabold text-ink">{score}<span className="text-[11px] font-semibold text-muted">/100 · {capabilityTier(score)}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-wash px-3.5 py-2.5">
      <div className="text-[16px] font-extrabold text-ink">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function ChannelRow({ channel, canReview, onChanged }: { channel: AdminChannel; canReview: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function verify(tier: 'SCREENSHOT' | 'INSIGHTS') {
    setBusy(tier);
    try { await api.post(`/v1/admin/channels/${channel.id}/verify`, { tier }); onChanged(); } finally { setBusy(null); }
  }
  async function unverify() {
    setBusy('unverify');
    try { await api.post(`/v1/admin/channels/${channel.id}/unverify`, { reason: 'Proof not accepted' }); onChanged(); } finally { setBusy(null); }
  }
  async function approveChannel() {
    setBusy('approve');
    try { await api.post(`/v1/admin/channels/${channel.id}/approve`, {}); onChanged(); } finally { setBusy(null); }
  }
  async function rejectChannel() {
    setBusy('reject');
    try { await api.post(`/v1/admin/channels/${channel.id}/reject`, { reason: 'Channel not approved' }); onChanged(); } finally { setBusy(null); }
  }

  const basis = channel.is_group ? `${compactNumber(channel.active_participants ?? 0)} active` : `${compactNumber(channel.claimed_audience)} claimed`;

  return (
    <div className="rounded-2xl border border-rule p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
            {titleCase(channel.platform)}
            {channel.handle && <span className="text-[12.5px] font-normal text-muted">{channel.handle}</span>}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">{basis} · <span className="font-semibold text-ink">{compactNumber(channel.effective_reach)}</span> effective reach</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted">Gross following</div>
          <div className="text-[15px] font-extrabold text-ink">{compactNumber(channel.claimed_audience)}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusPill status={channel.status} />
        <StatusPill status={channel.verification_tier} />
        {channel.verified_at && <span className="text-[11.5px] text-muted">verified {relativeTime(channel.verified_at)}</span>}
      </div>

      {canReview && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
          <span className="text-[12px] font-semibold text-muted">Channel:</span>
          {channel.status !== 'ACTIVE' && (
            <Button size="sm" loading={busy === 'approve'} onClick={approveChannel}>✓ Approve</Button>
          )}
          {channel.status !== 'REJECTED' && (
            <Button size="sm" variant="danger" loading={busy === 'reject'} onClick={rejectChannel}>✕ Reject</Button>
          )}
          {channel.status === 'ACTIVE' && <span className="text-[12px] font-semibold text-ok">Approved — matched on</span>}
          {channel.status === 'REJECTED' && <span className="text-[12px] font-semibold text-muted">Rejected — not matched</span>}
        </div>
      )}

      {/* Evidence the admin verifies against: the handle/link (insights) + screenshot. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {channel.url ? (
          <a href={channel.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-3 py-1.5 text-[12.5px] font-semibold text-brand-700 transition hover:bg-wash">
            Open profile / link ↗
          </a>
        ) : channel.handle ? (
          <span className="rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-muted">{channel.handle}</span>
        ) : (
          <span className="rounded-full border border-dashed border-rule px-3 py-1.5 text-[12.5px] text-muted">No handle/link provided</span>
        )}
        {channel.screenshot_url ? (
          <a href={channel.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-3 py-1.5 text-[12.5px] font-semibold text-brand-700 transition hover:bg-wash">
            View screenshot ↗
          </a>
        ) : (
          <span className="rounded-full border border-dashed border-rule px-3 py-1.5 text-[12.5px] text-muted">No screenshot</span>
        )}
      </div>

      {canReview && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-rule pt-3">
          {channel.verification_tier === 'SELF' ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                loading={busy === 'SCREENSHOT'}
                disabled={!channel.screenshot_url}
                title={channel.screenshot_url ? undefined : 'The promoter has not uploaded a screenshot for this channel'}
                onClick={() => verify('SCREENSHOT')}
              >
                Verify · screenshot
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={busy === 'INSIGHTS'}
                disabled={!channel.url && !channel.handle}
                title={channel.url || channel.handle ? undefined : 'The promoter has not provided a handle or link for this channel'}
                onClick={() => verify('INSIGHTS')}
              >
                Verify · insights
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" loading={busy === 'unverify'} onClick={unverify}>Drop to self-reported</Button>
          )}
        </div>
      )}
    </div>
  );
}

function RejectModal({
  name,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  name: string | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={`Reject ${name ?? 'promoter'}?`} onClose={onClose}>
      <p className="text-[13.5px] text-muted">A reason is required — the promoter sees it and can fix their profile.</p>
      <Field>
        <textarea className="input mt-3 min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The WhatsApp screenshot does not show a follower count." />
      </Field>
      {error != null && <p className="mt-2 text-[12px] text-brand-700">Could not reject — try again.</p>}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant="danger" onClick={() => onConfirm(reason)} loading={pending} disabled={reason.trim().length < 5}>Reject</Button>
      </div>
    </Modal>
  );
}

/** The full promoter directory — every promoter, any status, searchable + filterable. */
function PromoterDirectory({ canReview }: { canReview: boolean }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['promoters-all'], queryFn: () => api.get<AdminPromoter[]>('/v1/admin/promoters') });
  const rows = q.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (filter !== 'all' && p.status.toUpperCase() !== filter) return false;
      if (!term) return true;
      return (p.full_name ?? '').toLowerCase().includes(term) || p.email.toLowerCase().includes(term) || p.phone_e164.includes(term);
    });
  }, [rows, search, filter]);

  if (q.isLoading) return <div className="flex h-40 items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;

  return (
    <>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search all promoters"
        filter={{
          value: filter,
          onChange: setFilter,
          options: [
            { value: 'all', label: 'All statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'AWAITING_APPROVAL', label: 'Awaiting approval' },
            { value: 'REJECTED', label: 'Rejected' },
          ],
        }}
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead className="border-b border-rule text-[12px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3.5">Promoter</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5 text-right">Channels</th>
                <th className="px-5 py-3.5 text-right">Reach</th>
                <th className="px-5 py-3.5 text-right">Trust</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.user_id} onClick={() => setOpenId(p.user_id)} className="cursor-pointer border-b border-rule transition last:border-0 hover:bg-wash">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name} className="h-9 w-9 text-[12px]" />
                      <div>
                        <div className="font-bold text-ink">{p.full_name ?? 'Unnamed'}</div>
                        <div className="text-[12px] text-muted">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{p.location_state ?? '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink">
                    {p.channels_count}
                    {p.top_platform ? <span className="ml-1 text-[11px] font-normal text-muted">{titleCase(p.top_platform)}</span> : ''}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink">{compactNumber(p.total_reach)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink">{Math.round(p.trust_score)}</td>
                  <td className="px-5 py-3.5"><StatusPill status={p.status} /></td>
                  <td className="px-5 py-3.5 text-muted">{relativeTime(p.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">No promoters match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openId && <PromoterModal userId={openId} canReview={canReview} onClose={() => setOpenId(null)} />}
    </>
  );
}

/** Opens any promoter (from the directory) to review/approve their channels and
 *  deactivate/reactivate them — not just the pending-approval queue. */
function PromoterModal({ userId, canReview, onClose }: { userId: string; canReview: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['promoter', userId], queryFn: () => api.get<PromoterFull>(`/v1/admin/promoters/${userId}`) });
  const p = q.data;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['promoter', userId] }); void qc.invalidateQueries({ queryKey: ['promoters-all'] }); };

  const setActive = useMutation({
    mutationFn: (active: boolean) => api.post(`/v1/admin/promoters/${userId}/${active ? 'reactivate' : 'deactivate'}`),
    onSuccess: refresh,
  });

  return (
    <Modal title={p?.full_name ?? 'Promoter'} onClose={onClose}>
      {!p ? (
        <div className="grid h-32 place-items-center text-brand"><Spinner className="h-6 w-6" /></div>
      ) : (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[12.5px] text-muted">📱 {p.phone_e164} · ✉ {p.email} · 📍 {p.location_state ?? '—'}</div>
            <StatusPill status={p.status} />
          </div>

          {canReview && (p.status === 'ACTIVE' || p.status === 'SUSPENDED') && (
            p.status === 'SUSPENDED' ? (
              <Button size="sm" loading={setActive.isPending} onClick={() => setActive.mutate(true)}>Reactivate promoter</Button>
            ) : (
              <Button size="sm" variant="danger" loading={setActive.isPending} onClick={() => setActive.mutate(false)}>Deactivate promoter</Button>
            )
          )}

          <div className="text-[13px] font-semibold text-ink">Channels · {p.channels.length}</div>
          <div className="space-y-3">
            {p.channels.length === 0 && <div className="rounded-xl border border-rule p-4 text-[13px] text-muted">No channels submitted.</div>}
            {p.channels.map((c) => (
              <ChannelRow key={c.id} channel={c} canReview={canReview} onChanged={refresh} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
