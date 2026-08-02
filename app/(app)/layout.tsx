'use client';

import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Spinner } from '@/components/ui/Spinner';
import { useRequireAuth } from '@/lib/auth';
import { api, type PendingCampaign, type PendingPromoter, type PendingSubmission, type PendingWithdrawal } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();

  const counts = useQuery({
    queryKey: ['nav-counts'],
    enabled: !!user,
    queryFn: async () => {
      const [promoters, campaigns, submissions, withdrawals] = await Promise.all([
        api.get<PendingPromoter[]>('/v1/admin/queues/promoters'),
        api.get<PendingCampaign[]>('/v1/admin/queues/campaigns'),
        api.get<PendingSubmission[]>('/v1/admin/queues/submissions'),
        api.get<PendingWithdrawal[]>('/v1/admin/queues/withdrawals'),
      ]);
      return {
        '/promoters': promoters.length,
        '/campaigns': campaigns.length,
        '/finance': withdrawals.length,
        '/submissions': submissions.length,
      } as Record<string, number>;
    },
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar counts={counts.data} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-rule bg-paper px-6 py-3">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
