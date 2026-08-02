'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/promoters', label: 'Promoters', icon: '👥' },
  { href: '/clients', label: 'Clients', icon: '🏢' },
  { href: '/campaigns', label: 'Campaigns', icon: '📣' },
  { href: '/submissions', label: 'Submissions', icon: '🧾' },
  { href: '/finance', label: 'Finance', icon: '💳' },
  { href: '/analytics', label: 'Performance', icon: '📊' },
];

export function Sidebar({ counts }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar px-4 py-5 text-white">
      <div className="px-2">
        <Logo dark />
      </div>

      <nav className="mt-8 space-y-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const count = counts?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-semibold transition ${
                active ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-[15px]">{item.icon}</span>
                {item.label}
              </span>
              {count ? (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? 'bg-white/25' : 'bg-brand text-white'}`}>
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          <span>⚙️</span> Settings
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          <span>↩︎</span> Log out
        </button>

        <div className="mt-3 rounded-2xl bg-white/5 p-3">
          <div className="text-[13px] font-bold text-white">{user?.email ?? '—'}</div>
          <div className="text-[11px] text-white/50">{user?.capabilities?.length ? user.capabilities.join(' · ') : 'Admin'}</div>
        </div>
      </div>
    </aside>
  );
}
