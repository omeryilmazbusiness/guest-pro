import { useState } from "react";
import { Plus, ChevronRight, Sparkles } from "lucide-react";
import type { QuickAction } from "@workspace/api-client-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GuestHotelQuickLinksProps {
  quickActions?: QuickAction[];
}

export function GuestHotelQuickLinks({ quickActions: _quickActions }: GuestHotelQuickLinksProps) {
  const { t } = useLocale();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <section className={dash.section} aria-label={t.hotelConnectSection}>
        <h3 className={dash.sectionTitle}>{t.hotelConnectSection}</h3>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 px-2.5 py-2.5 text-start",
            "transition-colors duration-200 hover:border-zinc-300/80 hover:bg-white active:scale-[0.99]",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-700 ring-1 ring-zinc-200/60">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-[11px] font-medium leading-tight tracking-tight text-zinc-800">
              {t.morePlusTitle}
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-zinc-400">{t.morePlusSubtitle}</p>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={1.5} />
        </button>
      </section>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-zinc-100 p-6">
          <DialogHeader className="items-center text-center space-y-3">
            <span className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-zinc-400" />
            </span>
            <DialogTitle className="text-xl font-semibold text-zinc-900">
              {t.comingSoonTitle}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-zinc-500 leading-relaxed">
              {t.comingSoonBody}
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="mt-2 w-full py-3 rounded-xl bg-zinc-900 text-white text-[15px] font-semibold hover:bg-zinc-800 transition-colors"
          >
            {t.comingSoonClose}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
