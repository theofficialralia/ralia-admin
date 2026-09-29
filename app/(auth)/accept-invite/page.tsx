'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { api, ApiError, type Tokens } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function AcceptInviteInner() {
  const router = useRouter();
  const { setTokens } = useAuth();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) return setError('Choose a password of at least 10 characters.');
    if (password !== confirm) return setError('Those passwords don’t match.');
    setBusy(true);
    try {
      const tokens = await api.post<Tokens>('/v1/admin/team/accept', { token, password }, { auth: false });
      await setTokens(tokens);
      router.replace('/promoters');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept the invitation.');
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-7 sm:p-8">
        <Logo label="Admin console" />
        <h1 className="mt-6 text-[22px] font-extrabold tracking-tight text-ink">Join the team</h1>
        <p className="mt-1 text-[13.5px] text-muted">Set a password to accept your admin invitation.</p>

        {!token ? (
          <p className="mt-6 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-[13px] text-brand-700">
            This link is missing its invitation token. Please use the link from your email.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="New password">
              <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 10 characters" required />
            </Field>
            <Field label="Confirm password">
              <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" required />
            </Field>

            {error && <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-[13px] text-brand-700">{error}</p>}

            <Button type="submit" size="lg" loading={busy} className="w-full">Accept &amp; sign in</Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return <Suspense fallback={null}><AcceptInviteInner /></Suspense>;
}
