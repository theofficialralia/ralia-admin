import Image from 'next/image';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <Image src="/ralia-mark.png" alt="Ralia" fill priority className="object-contain" sizes="48px" />
    </span>
  );
}

export function Logo({ label = 'Admin', dark = false }: { label?: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <div className={`text-[19px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>Ralia</div>
        {label && <div className={`text-[12px] ${dark ? 'text-white/55' : 'text-muted'}`}>{label}</div>}
      </div>
    </div>
  );
}
