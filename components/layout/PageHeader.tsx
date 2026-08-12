/**
 * The standard page header: a red breadcrumb (`Queue · Users`), a large bold
 * H1, and a grey subtitle — matching the admin design across every screen.
 */
export function PageHeader({
  crumb,
  title,
  subtitle,
  actions,
}: {
  crumb?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumb && <div className="text-[13px] font-semibold text-brand-700">{crumb}</div>}
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[14.5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
