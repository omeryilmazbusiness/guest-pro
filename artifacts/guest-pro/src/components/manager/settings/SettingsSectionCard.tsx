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
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 leading-snug">{hint}</p>}
    </div>
  );
}

export function SettingsSectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm shadow-zinc-100/60 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-zinc-50 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
