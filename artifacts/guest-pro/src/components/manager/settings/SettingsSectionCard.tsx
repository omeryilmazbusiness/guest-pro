export function SettingsCategoryHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="pt-2 pb-1">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-zinc-500 leading-snug">{description}</p>
      )}
    </div>
  );
}

export function SettingsField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-1.5 ${className}` : "space-y-1.5"}>
      <label className="block text-xs font-semibold text-zinc-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 leading-snug">{hint}</p>}
    </div>
  );
}

export function SettingsSectionCard({
  id,
  icon,
  title,
  subtitle,
  children,
}: {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-white"
    >
      <div className="flex items-start gap-2.5 border-b border-zinc-100 px-4 py-3">
        {icon ? (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-zinc-500">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
