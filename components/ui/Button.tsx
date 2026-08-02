'use client';

import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 shadow-sm',
  secondary: 'border border-rule bg-paper text-ink hover:bg-wash',
  ghost: 'text-body hover:bg-wash',
  danger: 'border border-brand/30 text-brand-700 hover:bg-brand/5',
};

const sizes: Record<Size, string> = {
  sm: 'text-[13px] px-3 py-1.5',
  md: 'text-[14px] px-4 py-2.5',
  lg: 'text-[15px] px-5 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
