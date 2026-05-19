import { useState } from "react";
import { MessageCircle, Plus, ChevronRight, Sparkles } from "lucide-react";
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

function isReceptionAction(action: QuickAction): boolean {
  const cat = action.category.toLowerCase();
  const label = action.label.toLowerCase();
  return (
    cat.includes("reception") ||
    label.includes("reception") ||
    label.includes("resepsiyon") ||
    action.icon === "phone"
  );
}

interface GuestHotelQuickLinksProps {
  quickActions?: QuickAction[];
  onReceptionChat: () => void;
}

export function GuestHotelQuickLinks({ quickActions, onReceptionChat }: GuestHotelQuickLinksProps) {
  const { t } = useLocale();
  const [moreOpen, setMoreOpen] = useState(false);

  const receptionAction = quickActions?.find(isReceptionAction);
  const receptionLabel = receptionAction?.label ?? t.receptionLiveTitle;

  return (
    <>
      <section className={dash.section} aria-label={t.hotelConnectSection}>
        <h3 className={dash.sectionTitle}>
          {t.hotelConnectSection}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Reception — live chat */}
          <button
            type="button"
            onClick={onReceptionChat}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-zinc-200 bg-white",
              "px-3.5 py-3 text-left shadow-sm",
              "hover:border-zinc-300 hover:shadow-md active:scale-[0.99] transition-all duration-200 group",
            )}
          >
            <span
              className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100/80 pointer-events-none"
              aria-hidden
            />
            <span className="relative flex items-start justify-between gap-3 mb-2.5">
              <span className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-md shadow-zinc-900/15">
                <MessageCircle className="w-5 h-5 text-white" strokeWidth={1.75} />
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                  {t.receptionLiveBadge}
                </span>
              </span>
            </span>
            <span className="relative block">
              <p className="text-[14px] font-semibold text-zinc-900 leading-snug tracking-tight">
                {receptionLabel}
              </p>
              <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">
                {t.receptionLiveSubtitle}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-2.5 text-[12px] font-semibold text-zinc-900 group-hover:gap-2 transition-all">
                {t.receptionLiveCta}
                <ChevronRight className="w-4 h-4" />
              </span>
            </span>
          </button>

          {/* More+ — coming soon */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/60",
              "px-3.5 py-3 text-left shadow-sm",
              "hover:bg-white hover:border-zinc-200 hover:shadow-md active:scale-[0.99] transition-all duration-200 group",
            )}
          >
            <span className="flex items-start justify-between gap-3 mb-2.5">
              <span className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
                <Plus className="w-5 h-5 text-zinc-700" strokeWidth={1.75} />
              </span>
              <Sparkles className="w-4 h-4 text-zinc-300" />
            </span>
            <p className="text-[14px] font-semibold text-zinc-900 leading-snug tracking-tight">
              {t.morePlusTitle}
            </p>
            <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{t.morePlusSubtitle}</p>
            <span className="inline-flex items-center gap-1.5 mt-2.5 text-[12px] font-medium text-zinc-400">
              <ChevronRight className="w-4 h-4 opacity-60" />
            </span>
          </button>
        </div>
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
