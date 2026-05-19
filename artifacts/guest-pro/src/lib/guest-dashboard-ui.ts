/** Compact mobile-first tokens for the guest dashboard (/guest). */
export const dash = {
  section: "mb-4",
  sectionTitle: "text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 px-0.5",
  card: "rounded-2xl",
  cardPad: "px-3.5 py-3",
  rowGap: "gap-1.5",
  title: "text-[14px] font-semibold text-zinc-900 leading-snug",
  subtitle: "text-[12px] text-zinc-500 leading-snug",
  icon: "w-9 h-9 rounded-xl",
  iconLg: "w-10 h-10 rounded-xl",
  /** Premium light card — separate tiles */
  lightCard:
    "rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-zinc-200/90 active:scale-[0.995]",
} as const;
