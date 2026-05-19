import { useState } from "react";
import { Receipt, ChevronRight } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useTodayBill, billHasCharges } from "@/hooks/use-daily-bill";
import { formatMoney } from "@/lib/format-money";
import { tFmt } from "@/lib/i18n";
import { DailyBillSheet } from "./DailyBillSheet";

export function DailyBillCard() {
  const { t, uiLocale } = useLocale();
  const { data: todayBill, isLoading } = useTodayBill();
  const [open, setOpen] = useState(false);

  const hasCharges = billHasCharges(todayBill);
  const totalLabel =
    hasCharges && todayBill
      ? formatMoney(todayBill.subtotal, todayBill.currency, uiLocale)
      : null;

  return (
    <>
      <section aria-label={t.billSection}>
        <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
          {t.billSection}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-2xl border border-zinc-100 bg-gradient-to-br from-white via-white to-zinc-50/90 shadow-sm px-5 py-4 flex items-center gap-4 transition-all active:scale-[0.99] hover:border-zinc-200 hover:shadow-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-zinc-900/5 border border-zinc-100 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-zinc-700" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-zinc-900 leading-snug">{t.billCardTitle}</p>
            <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">
              {isLoading
                ? "…"
                : totalLabel
                  ? tFmt(t.billCardSubtitleAmount, { amount: totalLabel })
                  : t.billCardSubtitleToday}
            </p>
            </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
        </button>
      </section>

      <DailyBillSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
