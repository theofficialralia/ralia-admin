/** A small status chip. Tone is derived from the status text where possible. */
const TONES: Record<string, string> = {
  ok: 'bg-ok-wash text-ok',
  warn: 'bg-warn-wash text-warn',
  brand: 'bg-brand/10 text-brand-700',
  muted: 'bg-wash text-muted',
};

function toneFor(status: string): keyof typeof TONES {
  const s = status.toUpperCase();
  if (['ACTIVE', 'LIVE', 'APPROVED', 'PAID', 'SETTLED', 'FULFILLED', 'SUCCESS'].includes(s)) return 'ok';
  if (['PENDING', 'PENDING_REVIEW', 'AWAITING_APPROVAL', 'REQUESTED', 'RECORDED', 'CONFIRMING_PAYMENT'].includes(s)) return 'warn';
  if (['REJECTED', 'MISMATCH', 'FAILED', 'CANCELLED', 'SELF'].includes(s)) return 'brand';
  return 'muted';
}

export function StatusPill({ status, tone, className = '' }: { status: string; tone?: keyof typeof TONES; className?: string }) {
  const t = tone ?? toneFor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONES[t]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}
