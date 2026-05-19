import { useMemo, useState } from "react";
import {
  X,
  Receipt,
  UtensilsCrossed,
  Wine,
  ConciergeBell,
  CircleDot,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { useDailyBill, useFolioDays } from "@/hooks/use-daily-bill";
import { formatMoney } from "@/lib/format-money";
import { tFmt, type GuestTranslations } from "@/lib/i18n";
import { todayIsoDate, type FolioCategory, type FolioLine } from "@/lib/folio";
import type { LucideIcon } from "lucide-react";

interface DailyBillSheetProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ICON: Record<FolioCategory, LucideIcon> = {
  FOOD: UtensilsCrossed,
  ROOM_SERVICE: ConciergeBell,
  MINIBAR: Wine,
  OTHER: CircleDot,
};

function formatBillDate(date: string, locale: string, t: GuestTranslations): string {
  const today = todayIsoDate();
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (date === today) return t.billToday;
  if (date === yesterdayStr) return t.billYesterday;

  try {
    const d = new Date(`${date}T12:00:00.000Z`);
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return date;
  }
}

function LineRow({
  line,
  locale,
}: {
  line: FolioLine;
  locale: string;
}) {
  const Icon = CATEGORY_ICON[line.category] ?? CircleDot;
  const unit =
    line.quantity > 1
      ? formatMoney(line.unitAmount, line.currency, locale)
      : null;

  return (
    <li className="flex items-start gap-3 py-3.5 border-b border-zinc-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[14px] font-medium text-zinc-900 leading-snug">{line.description}</p>
        {line.quantity > 1 && unit && (
          <p className="text-[12px] text-zinc-400 mt-0.5">
            {line.quantity} × {unit}
          </p>
        )}
      </div>
      <p className="text-[14px] font-semibold text-zinc-900 tabular-nums shrink-0">
        {formatMoney(line.lineTotal, line.currency, locale)}
      </p>
    </li>
  );
}

export function DailyBillSheet({ open, onClose }: DailyBillSheetProps) {
  const { user } = useAuth();
  const { t, uiLocale } = useLocale();
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());

  const { data: bill, isLoading } = useDailyBill(selectedDate);
  const { data: daysData } = useFolioDays(14);

  const dayChips = useMemo(() => {
    const today = todayIsoDate();
    const fromApi = daysData?.days ?? [];
    const dates = new Set<string>([today, ...fromApi.map((d) => d.date)]);
    return Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 8);
  }, [daysData]);

  if (!open) return null;

  const subtotal = bill ? formatMoney(bill.subtotal, bill.currency, uiLocale) : "—";
  const hasLines = (bill?.lines.length ?? 0) > 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.billSheetTitle}
        className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300 max-h-[min(92dvh,720px)] flex flex-col"
      >
        <div className="bg-white rounded-t-[28px] shadow-2xl flex flex-col max-h-[inherit] overflow-hidden">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-zinc-200" />
          </div>

          <div className="px-6 pt-3 pb-4 flex items-start justify-between gap-3 shrink-0 border-b border-zinc-50">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 shadow-md shadow-zinc-900/15">
                <Receipt className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[20px] font-serif text-zinc-900 leading-tight">{t.billSheetTitle}</h2>
                <p className="text-[13px] text-zinc-500 mt-0.5">
                  {formatBillDate(selectedDate, uiLocale, t)}
                  {user?.roomNumber ? ` · ${tFmt(t.billRoomLabel, { room: user.roomNumber })}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 text-zinc-300 hover:text-zinc-500 transition-colors rounded-full"
              aria-label={t.billClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date chips */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            {dayChips.map((date) => {
              const active = date === selectedDate;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-medium transition-all ${
                    active
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {formatBillDate(date, uiLocale, t)}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-6 min-h-0">
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-zinc-200 border-t-zinc-600 animate-spin" />
              </div>
            ) : hasLines && bill ? (
              <ul className="pb-2">
                {bill.lines.map((line) => (
                  <LineRow key={line.id} line={line} locale={uiLocale} />
                ))}
              </ul>
            ) : (
              <div className="py-14 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-6 h-6 text-zinc-300" />
                </div>
                <p className="text-[16px] font-medium text-zinc-800">{t.billEmptyTitle}</p>
                <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed max-w-xs mx-auto">
                  {t.billEmptySubtitle}
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-zinc-100 bg-zinc-50/80">
            <div className="flex items-end justify-between gap-4 mb-2">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">
                {t.billSubtotal}
              </span>
              <span className="text-[26px] font-serif text-zinc-900 tabular-nums leading-none">
                {subtotal}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed text-center">{t.billRoomChargeNote}</p>
          </div>
        </div>
      </div>
    </>
  );
}
