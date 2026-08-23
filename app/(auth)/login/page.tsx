'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { api, ApiError, type Tokens } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SUPPORT } from '@/lib/support';

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokens = await api.post<Tokens>('/v1/auth/login', { email, password }, { auth: false });
      await setTokens(tokens);
      router.replace('/promoters');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign you in.');
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-7 sm:p-8">
        <Logo label="Admin console" />
        <h1 className="mt-6 text-[22px] font-extrabold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1 text-[13.5px] text-muted">Admin access only. Every action you take is audited.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email">
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ralia.co" required />
          </Field>
          <Field label="Password">
            <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
          </Field>

          {error && <p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-[13px] text-brand-700">{error}</p>}

          <Button type="submit" size="lg" loading={busy} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
      <p className="mt-5 text-center text-[12px] leading-relaxed text-muted">
        <a href={SUPPORT.termsUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700">Terms of Service</a>
        {' · '}
        <a href={SUPPORT.privacyUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700">Privacy Notice</a>
      </p>
    </div>
  );
}
