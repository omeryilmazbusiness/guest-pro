import { useState } from "react";
import { Receipt } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useTodayBill, billHasCharges } from "@/hooks/use-daily-bill";
import { formatMoney } from "@/lib/format-money";
import { tFmt } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DailyBillSheet } from "./DailyBillSheet";
import { triggerHaptic } from "@/lib/haptic";

const guestFramedLight =
  "overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_-12px_rgba(0,0,0,0.12)] ring-1 ring-zinc-200/80";

export function DailyBillCard() {
  const { t, uiLocale } = useLocale();
  const { data: todayBill, isLoading } = useTodayBill();
  const [open, setOpen] = useState(false);

  const hasCharges = billHasCharges(todayBill);
  const totalLabel =
    hasCharges && todayBill
      ? formatMoney(todayBill.subtotal, todayBill.currency, uiLocale)
      : null;

  const subtitle = isLoading
    ? "…"
    : totalLabel
      ? tFmt(t.billCardSubtitleAmount, { amount: totalLabel })
      : t.billCardSubtitleToday;

  return (
    <>
      <section aria-label={t.billSection}>
        <div className={guestFramedLight}>
          <div className="border-b border-zinc-100 px-4 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {t.billSection}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("open");
              setOpen(true);
            }}
            className={cn(
              "flex w-full flex-col items-center gap-2.5 px-4 py-4 text-center",
              "transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
            )}
            aria-label={t.billCardTitle}
          >
            <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
              <Receipt
                className="guest-chat-entry-icon h-11 w-11 text-zinc-700"
                strokeWidth={1.5}
              />
            </span>
            <span className="block max-w-[14rem]">
              <span className="block text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
                {t.billCardTitle}
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-zinc-500">{subtitle}</span>
            </span>
          </button>
        </div>
      </section>

      <DailyBillSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
