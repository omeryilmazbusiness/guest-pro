import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GuestTranslations } from "@/lib/i18n";
import { tFmt } from "@/lib/i18n";
import { createServiceRequest } from "@/lib/service-requests";
import { syncMyRequestToCache } from "@/lib/guest-my-requests-cache";
import {
  CONCIERGE_WHEN_OPTIONS,
  conciergeServiceLabel,
  conciergeWhenLabel,
  buildConciergeStructuredData,
  buildConciergeSummary,
  type ConciergeService,
  type ConciergeWhen,
} from "@/lib/guest-concierge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GuestConciergeBookingSheetProps {
  open: boolean;
  service: ConciergeService | null;
  onClose: () => void;
  t: GuestTranslations;
}

export function GuestConciergeBookingSheet({
  open,
  service,
  onClose,
  t,
}: GuestConciergeBookingSheetProps) {
  const queryClient = useQueryClient();
  const [when, setWhen] = useState<ConciergeWhen>("asap");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      setWhen("asap");
      setNotes("");
    }
  };

  const handleSubmit = async () => {
    if (!service) return;
    setSubmitting(true);
    try {
      const created = await createServiceRequest({
        requestType: "GENERAL_SERVICE_REQUEST",
        summary: buildConciergeSummary(t, service, when, notes),
        structuredData: buildConciergeStructuredData(service, when, notes),
      });
      syncMyRequestToCache(queryClient, created);
      toast.success(t.conciergeSuccessToast);
      handleOpenChange(false);
    } catch {
      toast.error(t.sendFailed);
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) return null;

  const serviceLabel = conciergeServiceLabel(t, service);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[min(100vw-1.5rem,24rem)] gap-0 overflow-hidden rounded-[1.35rem] border-zinc-100 p-0">
        <DialogHeader className="border-b border-zinc-100 px-4 pb-3 pt-4 text-start">
          <DialogTitle className="text-base font-semibold text-zinc-900">
            {tFmt(t.conciergeSheetTitle, { service: serviceLabel })}
          </DialogTitle>
          <p className="text-[12px] font-normal text-zinc-500">{t.conciergeSheetSubtitle}</p>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {t.conciergeWhenLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CONCIERGE_WHEN_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setWhen(option)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors",
                    when === option
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  {conciergeWhenLabel(t, option)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {t.conciergeNotesLabel}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.conciergeNotesPlaceholder}
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center rounded-2xl bg-zinc-900 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t.conciergeSubmit
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
