'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/Avatar';
import {
  IconCampaigns,
  IconClients,
  IconCollapse,
  IconFinance,
  IconLogout,
  IconPerformance,
  IconPromoters,
  IconSettings,
} from '@/components/brand/icons';
import { useAuth } from '@/lib/auth';
import { nameFromEmail, roleFromCapabilities } from '@/lib/format';

const NAV = [
  { href: '/promoters', label: 'Promoters', Icon: IconPromoters },
  { href: '/clients', label: 'Clients', Icon: IconClients },
  { href: '/campaigns', label: 'Campaigns', Icon: IconCampaigns },
  { href: '/finance', label: 'Finance', Icon: IconFinance },
  { href: '/analytics', label: 'Performance', Icon: IconPerformance },
];

export function Sidebar({
  counts,
  collapsed = false,
  onToggleCollapse,
}: {
  counts?: Record<string, number>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const name = nameFromEmail(user?.email);
  const role = roleFromCapabilities(user?.capabilities);

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden bg-sidebar py-5 text-white transition-[width] duration-200 ${
        collapsed ? 'w-[76px] px-3' : 'w-64 px-4'
      }`}
    >
      {/* logo row + collapse control */}
      <div className="flex items-center justify-between px-2">
        {collapsed ? <LogoMark className="h-8 w-8" /> : <Logo dark />}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white ${collapsed ? 'absolute right-3 top-6 opacity-0 hover:opacity-100' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <IconCollapse className={`h-[18px] w-[18px] ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <nav className="mt-8 space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          const count = counts?.[href];
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl py-2.5 text-[14px] font-semibold transition ${
                collapsed ? 'justify-center px-0' : 'justify-between px-3'
              } ${active ? 'bg-brand text-white shadow-sm' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
            >
              <span className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                <Icon className="h-[19px] w-[19px]" />
                {!collapsed && label}
              </span>
              {!collapsed && count ? (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80'}`}>
                  {count}
                </span>
              ) : null}
              {collapsed && count ? (
                <span className="absolute ml-6 -mt-5 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <Link
          href="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center rounded-xl py-2.5 text-[14px] font-semibold transition ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${
            pathname.startsWith('/settings') ? 'bg-brand text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'
          }`}
        >
          <IconSettings className="h-[19px] w-[19px]" /> {!collapsed && 'Settings'}
        </Link>
        <button
          onClick={signOut}
          title={collapsed ? 'Log out' : undefined}
          className={`flex w-full items-center rounded-xl py-2.5 text-[14px] font-semibold text-white/65 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
        >
          <IconLogout className="h-[19px] w-[19px]" /> {!collapsed && 'Log out'}
        </button>

        {!collapsed && (
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3">
            {/* signature red glow */}
            <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-brand/50 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <Avatar name={name} className="h-9 w-9 text-[13px]" />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13.5px] font-bold text-white">{name}</div>
                <div className="truncate text-[11.5px] text-white/55">{role}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
