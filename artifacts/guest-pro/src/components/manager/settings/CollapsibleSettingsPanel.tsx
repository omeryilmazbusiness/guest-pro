import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSettingsPanel({
  id,
  icon,
  title,
  subtitle,
  children,
  footer,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === id) setOpen(true);
  }, [id]);

  return (
    <div
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-white"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50/80"
        aria-expanded={open}
      >
        <span className="mt-0.5 shrink-0 text-zinc-500">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-zinc-900">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-zinc-100 px-4 py-3">
          {children}
          {footer}
        </div>
      )}
    </div>
  );
}
