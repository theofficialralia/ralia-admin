'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatusPill } from '@/components/ui/StatusPill';
import { api, type AdminClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { relativeTime } from '@/lib/format';

export default function ClientsPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['clients'], queryFn: () => api.get<AdminClient[]>('/v1/admin/clients') });

  const setStatus = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'deactivate' | 'reactivate' }) => api.post(`/v1/admin/clients/${id}/${action}`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  if (q.isLoading) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const clients = q.data ?? [];

  return (
    <div>
      <div className="mb-5">
        <div className="text-[13px] font-semibold text-brand-700">Directory</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink">Clients</h1>
        <p className="mt-1 text-[14px] text-muted">Every business signed up on Ralia.</p>
      </div>

      {clients.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-muted"><div className="text-[15px] font-semibold text-ink">No clients yet</div></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-rule text-[12px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3 text-right">Campaigns</th>
                <th className="px-4 py-3 text-right">Spent</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                {can('REVIEW_EVIDENCE') && <th className="px-4 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const suspended = c.status === 'SUSPENDED';
                return (
                  <tr key={c.org_id} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} className="h-8 w-8 text-[12px]" />
                        <div>
                          <div className="font-bold text-ink">{c.name}</div>
                          <div className="text-[12px] text-muted">{c.email}{c.industry ? ` · ${c.industry}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{c.campaigns_created}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{c.spent.amount_display}</td>
                    <td className="px-4 py-3 text-muted">{relativeTime(c.created_at)}</td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    {can('REVIEW_EVIDENCE') && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant={suspended ? 'secondary' : 'danger'}
                          loading={setStatus.isPending && setStatus.variables?.id === c.org_id}
                          onClick={() => setStatus.mutate({ id: c.org_id, action: suspended ? 'reactivate' : 'deactivate' })}
                        >
                          {suspended ? 'Reactivate' : 'Deactivate'}
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
