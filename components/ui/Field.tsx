export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] text-brand-700">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
