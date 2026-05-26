import {
  Building2,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  SquareArrowOutUpRight,
  Trash2,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { countryFlag } from "@/lib/locale";
import { PLAN_LABELS } from "@/lib/platform-plans";
import type { PlatformHotel } from "@/lib/platform-api";
import { absoluteAppHref, hotelLoginPath } from "@/lib/tenant-path";
import { cn } from "@/lib/utils";
import { HotelCardAvatar } from "@/components/platform/HotelCardAvatar";

export interface PlatformHotelsListProps {
  hotels: PlatformHotel[];
  loading?: boolean;
  togglingHotelId: number | null;
  onEditHotel: (hotel: PlatformHotel) => void;
  onEditManager: (hotel: PlatformHotel) => void;
  onDeactivate: (hotel: PlatformHotel) => void;
  onDelete: (hotel: PlatformHotel) => void;
  onAddHotel: () => void;
}

function ActionIcon({
  label,
  onClick,
  href,
  disabled,
  variant = "default",
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "default" | "danger" | "accent";
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
    disabled && "pointer-events-none opacity-40",
    variant === "danger" && "text-red-600 hover:bg-red-50 hover:text-red-700",
    variant === "accent" &&
      "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 hover:text-white",
    variant === "default" &&
      "text-zinc-600 hover:bg-white hover:text-zinc-900 hover:shadow-sm ring-1 ring-transparent hover:ring-zinc-200/80",
  );

  const inner = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {children}
    </a>
  ) : (
    <button type="button" className={className} aria-label={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="top" className="rounded-lg px-2.5 py-1 text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function PlatformHotelsList({
  hotels,
  loading,
  togglingHotelId,
  onEditHotel,
  onEditManager,
  onDeactivate,
  onDelete,
  onAddHotel,
}: PlatformHotelsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50/80 to-white px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-zinc-100">
          <Building2 className="h-7 w-7 text-zinc-300" />
        </div>
        <p className="mt-4 text-base font-medium text-zinc-800">No properties yet</p>
        <p className="mt-1 text-sm text-zinc-500">Onboard your first hotel to get started.</p>
        <Button type="button" className="mt-6 h-11 rounded-xl px-6" onClick={onAddHotel}>
          <Plus className="mr-2 h-4 w-4" />
          Add hotel
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={280}>
      <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
        {hotels.map((h) => {
          const loginHref = absoluteAppHref(hotelLoginPath(h.slug));
          const toggling = togglingHotelId === h.id;
          const tier = h.planTier ?? "starter";

          return (
            <li key={h.id}>
              <article
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-white transition-all duration-200",
                  h.isActive
                    ? "border-zinc-200/90 shadow-sm ring-1 ring-zinc-100/90 hover:border-zinc-300 hover:shadow-md"
                    : "border-zinc-200/60 bg-zinc-50/40 opacity-[0.92] hover:opacity-100",
                )}
              >
                <div className="flex gap-4 p-4 sm:p-5">
                  <HotelCardAvatar
                    name={h.name}
                    slug={h.slug}
                    logoUrl={h.logoUrl}
                    cacheKey={h.updatedAt}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-[17px]">
                        {h.name}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          h.isActive
                            ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25"
                            : "bg-zinc-200/80 text-zinc-600",
                        )}
                      >
                        {h.isActive ? "Live" : "Paused"}
                      </span>
                      <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        {PLAN_LABELS[tier] ?? tier}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-zinc-400">/{h.slug}</p>
                    {h.address && (
                      <p className="mt-2 line-clamp-2 text-sm leading-snug text-zinc-600">
                        {h.countryCode ? (
                          <span className="mr-1" aria-hidden>
                            {countryFlag(h.countryCode)}
                          </span>
                        ) : null}
                        {h.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 border-t border-zinc-100 bg-gradient-to-r from-zinc-50/90 via-zinc-50/50 to-white px-3 py-2.5 sm:px-4">
                  <ActionIcon label="Edit hotel" onClick={() => onEditHotel(h)}>
                    <Pencil className="h-5 w-5" strokeWidth={2} />
                  </ActionIcon>
                  <ActionIcon label="Edit manager" onClick={() => onEditManager(h)}>
                    <UserCog className="h-5 w-5" strokeWidth={2} />
                  </ActionIcon>
                  <ActionIcon label="Open manager login" href={loginHref} variant="accent">
                    <SquareArrowOutUpRight className="h-5 w-5" strokeWidth={2} />
                  </ActionIcon>
                  <div className="mx-1.5 hidden h-7 w-px bg-zinc-200 sm:block" aria-hidden />
                  <ActionIcon
                    label={h.isActive ? "Deactivate" : "Activate"}
                    onClick={() => onDeactivate(h)}
                    disabled={toggling}
                  >
                    {toggling ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : h.isActive ? (
                      <Pause className="h-5 w-5" strokeWidth={2} />
                    ) : (
                      <Play className="h-5 w-5" strokeWidth={2} />
                    )}
                  </ActionIcon>
                  <ActionIcon label="Delete hotel" onClick={() => onDelete(h)} variant="danger">
                    <Trash2 className="h-5 w-5" strokeWidth={2} />
                  </ActionIcon>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
