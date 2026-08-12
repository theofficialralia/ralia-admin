'use client';

import { IconFilter, IconSearch } from '@/components/brand/icons';

/**
 * The per-list search + filter row the design puts above every table/queue:
 * a rounded search field on the left and an optional filter dropdown on the right.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  filter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  filter?: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] };
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input
          data-list-search
          className="input !pl-11"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {filter && (
        <div className="relative">
          <IconFilter className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="input cursor-pointer appearance-none !pl-11 !pr-10 font-semibold text-ink"
          >
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">▾</span>
        </div>
      )}
    </div>
  );
}
