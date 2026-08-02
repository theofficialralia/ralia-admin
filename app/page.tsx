'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user && user.roles.includes('ADMIN') ? '/promoters' : '/login');
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-brand">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
