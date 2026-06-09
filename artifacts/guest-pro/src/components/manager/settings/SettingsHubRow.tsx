import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsHubRowProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  onClick: () => void;
}

export function SettingsHubRow({
  icon: Icon,
  iconClassName,
  title,
  description,
  onClick,
}: SettingsHubRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 text-start shadow-sm transition-all hover:border-zinc-200 hover:shadow-md active:scale-[0.99]"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
          iconClassName ?? "border-zinc-100 bg-zinc-50 text-zinc-600",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">{description}</p>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
    </button>
  );
}
