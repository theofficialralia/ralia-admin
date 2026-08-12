'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, type AdminClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compactNumber, relativeTime } from '@/lib/format';

export default function ClientsPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirming, setConfirming] = useState<AdminClient | null>(null);
  const q = useQuery({ queryKey: ['clients'], queryFn: () => api.get<AdminClient[]>('/v1/admin/clients') });

  const setStatus = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'deactivate' | 'reactivate' }) => api.post(`/v1/admin/clients/${id}/${action}`, {}),
    onSuccess: () => { setConfirming(null); void qc.invalidateQueries({ queryKey: ['clients'] }); },
  });

  const clients = q.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter === 'active' && c.status === 'SUSPENDED') return false;
      if (filter === 'suspended' && c.status !== 'SUSPENDED') return false;
      if (!term) return true;
      return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
    });
  }, [clients, search, filter]);

  const totalSpentMinor = clients.reduce((s, c) => s + c.spent.amount_minor, 0);
  const activeCount = clients.filter((c) => c.status !== 'SUSPENDED').length;

  if (q.isLoading) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;

  return (
    <div>
      <PageHeader crumb="Directory" title="Clients" subtitle="Here’re all the businesses signed up on the platform." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total clients" value={compactNumber(clients.length)} accent="ink" />
        <StatCard label="Active" value={compactNumber(activeCount)} accent="ok" />
        <StatCard label="Total spent" value={`₦${compactNumber(Math.round(totalSpentMinor / 100))}`} accent="brand" />
      </div>

      {clients.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-muted"><div className="text-[15px] font-semibold text-ink">No clients yet</div></div>
      ) : (
        <>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search for a client"
            filter={{ value: filter, onChange: setFilter, options: [{ value: 'all', label: 'All clients' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }] }}
          />
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13.5px]">
                <thead className="border-b border-rule text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5 text-right">Campaigns created</th>
                    <th className="px-5 py-3.5 text-right">Amount spent</th>
                    <th className="px-5 py-3.5">Date joined</th>
                    <th className="px-5 py-3.5">Status</th>
                    {can('REVIEW_EVIDENCE') && <th className="px-5 py-3.5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const suspended = c.status === 'SUSPENDED';
                    return (
                      <tr key={c.org_id} className="border-b border-rule transition last:border-0 hover:bg-wash">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} className="h-9 w-9 text-[12px]" />
                            <div>
                              <div className="font-bold text-ink">{c.name}</div>
                              <div className="text-[12px] text-muted">{c.email}{c.industry ? ` · ${c.industry}` : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-ink">{c.campaigns_created}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-ink">{c.spent.amount_display}</td>
                        <td className="px-5 py-3.5 text-muted">{relativeTime(c.created_at)}</td>
                        <td className="px-5 py-3.5"><StatusPill status={c.status} /></td>
                        {can('REVIEW_EVIDENCE') && (
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant={suspended ? 'secondary' : 'danger'}
                              loading={setStatus.isPending && setStatus.variables?.id === c.org_id}
                              onClick={() => (suspended ? setStatus.mutate({ id: c.org_id, action: 'reactivate' }) : setConfirming(c))}
                            >
                              {suspended ? 'Reactivate' : 'Deactivate user'}
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">No clients match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {confirming && (
        <ConfirmModal
          title={`Deactivate ${confirming.name}?`}
          body="They lose access immediately and their live campaigns are paused. You can reactivate them at any time."
          confirmLabel="Deactivate user"
          danger
          pending={setStatus.isPending}
          onClose={() => setConfirming(null)}
          onConfirm={() => setStatus.mutate({ id: confirming.org_id, action: 'deactivate' })}
        />
      )}
    </div>
  );
}
