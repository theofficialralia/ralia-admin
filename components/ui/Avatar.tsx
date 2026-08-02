import { initials } from '@/lib/format';

export function Avatar({ name, className = 'h-9 w-9 text-[13px]' }: { name: string | null | undefined; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white ${className}`}>
      {initials(name)}
    </span>
  );
}
