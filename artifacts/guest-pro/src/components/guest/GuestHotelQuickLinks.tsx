import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import type { QuickAction } from "@workspace/api-client-react";
import { useLocale } from "@/hooks/use-locale";
import { dash } from "@/lib/guest-dashboard-ui";
import { GuestIconActionTile } from "@/components/guest/GuestIconActionTile";
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
        <div className="flex justify-center">
          <GuestIconActionTile
            icon={Plus}
            iconClassName="text-zinc-700"
            label={t.morePlusTitle}
            onClick={() => setMoreOpen(true)}
          />
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
