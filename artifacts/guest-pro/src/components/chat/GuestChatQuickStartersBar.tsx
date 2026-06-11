import { useState } from "react";
import {
  Building2,
  Car,
  ChevronUp,
  Compass,
  LayoutGrid,
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

const COLLAPSED_COUNT = 3;

interface GuestChatQuickStartersBarProps {
  starters: ResolvedGuestChatStarter[];
  onSelect: (starter: ResolvedGuestChatStarter) => void;
  moreLabel: string;
  lessLabel: string;
}

function StarterPill({
  starter,
  onSelect,
}: {
  starter: ResolvedGuestChatStarter;
  onSelect: (starter: ResolvedGuestChatStarter) => void;
}) {
  const Icon = ICONS[starter.icon];
  return (
    <button
      type="button"
      onClick={() => onSelect(starter)}
      className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97]"
    >
      <Icon className="h-3 w-3 shrink-0 text-zinc-500" strokeWidth={2} />
      <span className="truncate">{starter.title}</span>
    </button>
  );
}

/** Compact quick-start pills above the chat input — collapsed with a More toggle. */
export function GuestChatQuickStartersBar({
  starters,
  onSelect,
  moreLabel,
  lessLabel,
}: GuestChatQuickStartersBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (starters.length === 0) return null;

  const hasHidden = starters.length > COLLAPSED_COUNT;
  const visible = expanded ? starters : starters.slice(0, COLLAPSED_COUNT);

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-1 duration-300"
      data-testid="guest-chat-quick-starters"
    >
      <div
        className={cn(
          "flex flex-wrap gap-1.5",
          expanded && "animate-in fade-in duration-200",
        )}
      >
        {visible.map((starter) => (
          <StarterPill key={starter.id} starter={starter} onSelect={onSelect} />
        ))}

        {hasHidden && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-expanded={false}
            aria-label={moreLabel}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-200/90 bg-zinc-50/90 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-300 hover:bg-white active:scale-[0.97]"
          >
            <LayoutGrid className="h-3 w-3 text-zinc-500" strokeWidth={2} />
            {moreLabel}
          </button>
        )}

        {expanded && hasHidden && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-expanded
            aria-label={lessLabel}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-transparent bg-transparent px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-700"
          >
            <ChevronUp className="h-3 w-3" strokeWidth={2} />
            {lessLabel}
          </button>
        )}
      </div>
    </div>
  );
}
