/**
 * Line-icon set for the admin shell. Stroke icons on `currentColor`, sized by
 * the `className` (default 1.25rem). Kept inline (no icon dependency) so they
 * inherit theme colours and tree-shake to nothing.
 */
type IconProps = { className?: string };
const box = (className = 'h-[18px] w-[18px]') => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  xmlns: 'http://www.w3.org/2000/svg',
});

export function IconPromoters({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M16 3.5a3.2 3.2 0 0 1 0 6.2" />
      <path d="M20.5 20v-1.6a3.2 3.2 0 0 0-2.4-3.1" />
      <circle cx="9" cy="6.7" r="3.2" />
      <path d="M3 20v-1.6A3.4 3.4 0 0 1 6.4 15h5.2A3.4 3.4 0 0 1 15 18.4V20" />
    </svg>
  );
}

export function IconClients({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M3 20.5h18" />
      <path d="M5 20.5V6a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 6v14.5" />
      <path d="M15 10h2.5A1.5 1.5 0 0 1 19 11.5v9" />
      <path d="M8 8h4M8 11.5h4M8 15h4" />
    </svg>
  );
}

export function IconCampaigns({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M4 9.5v5a1 1 0 0 0 1 1h2l1.6 3.4a1 1 0 0 0 .9.6h.5a1 1 0 0 0 1-1.2L11 15.5" />
      <path d="M7 15.5V9.5l9.5-4.7A1 1 0 0 1 18 5.7v12.6a1 1 0 0 1-1.5.9L7 15.5H5" />
      <path d="M20.5 10v4" />
    </svg>
  );
}

export function IconFinance({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h12.5A1.5 1.5 0 0 1 19 8.5" />
      <rect x="3.5" y="7.5" width="17" height="11" rx="2" />
      <path d="M20.5 12h-3.2a1.6 1.6 0 0 0 0 3.2h3.2" />
      <circle cx="17.4" cy="13.6" r="0.4" fill="currentColor" />
    </svg>
  );
}

export function IconPerformance({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="12" width="2.6" height="5" rx="0.6" />
      <rect x="11.7" y="8" width="2.6" height="9" rx="0.6" />
      <rect x="16.4" y="10" width="2.6" height="7" rx="0.6" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M15 5.5H6.5A1.5 1.5 0 0 0 5 7v10a1.5 1.5 0 0 0 1.5 1.5H15" />
      <path d="M18.5 12H10" />
      <path d="m15.5 8.5 3.5 3.5-3.5 3.5" />
    </svg>
  );
}

export function IconCollapse({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15" />
      <path d="m15.5 9.5-2.5 2.5 2.5 2.5" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m20 20-4.5-4.5" />
    </svg>
  );
}

export function IconFilter({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function IconSun({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6" />
    </svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M20 13.5A8 8 0 1 1 10.5 4a6.2 6.2 0 0 0 9.5 9.5Z" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M5.5 15.5A1.5 1.5 0 0 1 4 14V6a1.5 1.5 0 0 1 1.5-1.5H14A1.5 1.5 0 0 1 15.5 6" />
    </svg>
  );
}

export function IconExternal({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M14 5h5v5" />
      <path d="M19 5l-7 7" />
      <path d="M18 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5H11" />
    </svg>
  );
}
