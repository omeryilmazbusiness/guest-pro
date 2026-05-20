import { useState } from "react";
import { Receipt, ChevronRight } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useTodayBill, billHasCharges } from "@/hooks/use-daily-bill";
import { formatMoney } from "@/lib/format-money";
import { tFmt } from "@/lib/i18n";
import { dash } from "@/lib/guest-dashboard-ui";
import { cn } from "@/lib/utils";
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
        <h3 className={dash.sectionTitle}>{t.billSection}</h3>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            dash.card,
            "w-full text-start border border-zinc-100 bg-gradient-to-br from-white to-zinc-50/90 shadow-sm px-3.5 py-2.5 flex items-center gap-3 active:scale-[0.99] hover:border-zinc-200 transition-all",
          )}
        >
          <span className={cn(dash.icon, "bg-zinc-900/[0.04] border border-zinc-100 flex items-center justify-center shrink-0")}>
            <Receipt className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
          </span>
          <span className="flex-1 min-w-0 block">
            <p className={dash.title}>{t.billCardTitle}</p>
            <p className={cn(dash.subtitle, "mt-0.5")}>
              {isLoading
                ? "…"
                : totalLabel
                  ? tFmt(t.billCardSubtitleAmount, { amount: totalLabel })
                  : t.billCardSubtitleToday}
            </p>
          </span>
          <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
        </button>
      </section>

      <DailyBillSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
