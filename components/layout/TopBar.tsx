'use client';

import { Avatar } from '@/components/ui/Avatar';
import { IconSearch } from '@/components/brand/icons';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { nameFromEmail, roleFromCapabilities } from '@/lib/format';

/**
 * Persistent global header from the design: a big rounded search field, the
 * theme switch, and a user chip (avatar + name). Search is a light client-side
 * hint that scrolls to / focuses the active page's own list filter.
 */
export function TopBar() {
  const { user } = useAuth();
  const name = nameFromEmail(user?.email);
  const role = roleFromCapabilities(user?.capabilities);

  return (
    <header className="flex items-center gap-4 border-b border-rule bg-paper/80 px-6 py-3 backdrop-blur">
      <form
        className="relative hidden max-w-2xl flex-1 md:block"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get('q');
          const el = document.querySelector<HTMLInputElement>('[data-list-search]');
          if (el) {
            el.focus();
            if (typeof q === 'string') {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
              setter?.call(el, q);
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }}
      >
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input name="q" className="input rounded-full !pl-11" placeholder="Search…" />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2.5 rounded-full border border-rule bg-paper py-1 pl-1 pr-4">
          <Avatar name={name} className="h-8 w-8 text-[12px]" />
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-ink">{name}</div>
            <div className="text-[11px] text-muted">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
