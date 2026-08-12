'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubmissionCard } from '@/components/campaigns/SubmissionCard';
import { api, type PendingSubmission } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * Global proof queue across all campaigns. Per-campaign review lives in the
 * campaign workspace; this stays as an all-in-one-place review surface.
 */
export default function SubmissionsPage() {
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['submissions'], queryFn: () => api.get<PendingSubmission[]>('/v1/admin/queues/submissions') });

  if (q.isLoading) return <div className="flex h-full items-center justify-center text-brand"><Spinner className="h-7 w-7" /></div>;
  const items = q.data ?? [];

  return (
    <div>
      <PageHeader crumb="Queue · Evidence" title="Review proof" subtitle="Check the screenshot against the count, then approve — the promoter is paid pro-rata on the verified views." />

      {items.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center text-muted">
          <div className="text-[15px] font-semibold text-ink">Nothing to review</div>
          <div className="mt-1 text-[13.5px]">No submissions are waiting.</div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((s) => <SubmissionCard key={s.id} submission={s} canReview={can('REVIEW_EVIDENCE')} />)}
        </div>
      )}
    </div>
  );
}
