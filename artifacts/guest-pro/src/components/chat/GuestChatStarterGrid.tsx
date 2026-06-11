import {
  Building2,
  Car,
  Compass,
  MapPinned,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { GuestChatStarterIcon, ResolvedGuestChatStarter } from "@/lib/guest-chat-starters";
import { cn } from "@/lib/utils";

const ICONS: Record<GuestChatStarterIcon, LucideIcon> = {
  food: UtensilsCrossed,
  trip: MapPinned,
  explore: Compass,
  spa: Sparkles,
  support: Wrench,
  taxi: Car,
  hotel: Building2,
};

const CARD_ACCENTS: Record<
  GuestChatStarterIcon,
  { iconWrap: string; icon: string; ring: string; wash: string }
> = {
  food: {
    iconWrap: "bg-amber-500/12",
    icon: "text-amber-600",
    ring: "ring-amber-500/10",
    wash: "from-amber-500/[0.06] via-transparent to-transparent",
  },
  trip: {
    iconWrap: "bg-sky-500/12",
    icon: "text-sky-600",
    ring: "ring-sky-500/10",
    wash: "from-sky-500/[0.06] via-transparent to-transparent",
  },
  explore: {
    iconWrap: "bg-emerald-500/12",
    icon: "text-emerald-600",
    ring: "ring-emerald-500/10",
    wash: "from-emerald-500/[0.06] via-transparent to-transparent",
  },
  spa: {
    iconWrap: "bg-violet-500/12",
    icon: "text-violet-600",
    ring: "ring-violet-500/10",
    wash: "from-violet-500/[0.06] via-transparent to-transparent",
  },
  support: {
    iconWrap: "bg-orange-500/12",
    icon: "text-orange-600",
    ring: "ring-orange-500/10",
    wash: "from-orange-500/[0.06] via-transparent to-transparent",
  },
  taxi: {
    iconWrap: "bg-indigo-500/12",
    icon: "text-indigo-600",
    ring: "ring-indigo-500/10",
    wash: "from-indigo-500/[0.06] via-transparent to-transparent",
  },
  hotel: {
    iconWrap: "bg-zinc-500/10",
    icon: "text-zinc-600",
    ring: "ring-zinc-500/10",
    wash: "from-zinc-500/[0.05] via-transparent to-transparent",
  },
};

interface GuestChatStarterGridProps {
  sectionLabel: string;
  starters: ResolvedGuestChatStarter[];
  onSelect: (starter: ResolvedGuestChatStarter) => void;
}

export function GuestChatStarterGrid({
  sectionLabel,
  starters,
  onSelect,
}: GuestChatStarterGridProps) {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {sectionLabel}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {starters.map((starter) => {
          const Icon = ICONS[starter.icon];
          const accent = CARD_ACCENTS[starter.icon];
          return (
            <button
              key={starter.id}
              type="button"
              onClick={() => onSelect(starter)}
              className={cn(
                "group relative overflow-hidden rounded-[20px] border border-white/90 bg-white/85 p-3.5 text-left",
                "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-16px_rgba(0,0,0,0.08)]",
                "backdrop-blur-xl transition-all duration-300",
                "hover:border-zinc-200/90 hover:bg-white hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_32px_-14px_rgba(0,0,0,0.12)]",
                "active:scale-[0.98]",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity duration-300 group-hover:opacity-100",
                  accent.wash,
                )}
                aria-hidden
              />
              <div className="relative flex flex-col gap-2.5">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[11px] ring-1 transition-transform duration-300 group-hover:scale-105",
                    accent.iconWrap,
                    accent.icon,
                    accent.ring,
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-snug tracking-tight text-zinc-900">
                    {starter.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                    {starter.hint}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
