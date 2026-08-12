'use client';

import { IconMoon, IconSun } from '@/components/brand/icons';
import { useTheme } from '@/lib/theme';

/**
 * Segmented light/dark switch: two pills, the active side filled brand-red —
 * matching the design's header control (a lone icon read as unfinished).
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const light = theme !== 'dark';
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper p-1" role="group" aria-label="Theme">
      <button
        onClick={() => { if (!light) toggle(); }}
        aria-pressed={light}
        aria-label="Light mode"
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${light ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
      >
        <IconSun className="h-[17px] w-[17px]" />
      </button>
      <button
        onClick={() => { if (light) toggle(); }}
        aria-pressed={!light}
        aria-label="Dark mode"
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${!light ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
      >
        <IconMoon className="h-[17px] w-[17px]" />
      </button>
    </div>
  );
}
