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

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="m5 13 4 4 10-11" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M12 4v11" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function IconWarning({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function IconSparkle({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M12 4l1.7 4.8L18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.5L12 4Z" />
      <path d="M18.5 15.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5Z" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M6.5 4h3l1.4 3.6-1.8 1.3a11 11 0 0 0 4.9 4.9l1.3-1.8L19 13.5v3a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 5 6.6 1.5 1.5 0 0 1 6.5 4Z" />
    </svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconEye({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ className }: IconProps) {
  return (
    <svg {...box(className)}>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 6.5 9.5 6.5a16.4 16.4 0 0 1-3 3.6" />
      <path d="M6.5 7.6A16.3 16.3 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 3.3-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
