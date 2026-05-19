import { useState, useCallback } from "react";
import { Copy, Check, Key, BedDouble, CalendarDays, User } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";

interface StayKeyCardProps {
  guestKeyDisplay?: string | null;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  firstName?: string;
  lastName?: string;
}

export function StayKeyCard({
  guestKeyDisplay,
  roomNumber,
  checkInDate,
  checkOutDate,
  firstName,
  lastName,
}: StayKeyCardProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!guestKeyDisplay) return;
    try {
      await navigator.clipboard.writeText(guestKeyDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = guestKeyDisplay;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [guestKeyDisplay]);

  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
        new Date(d),
      );
    } catch {
      return d;
    }
  };

  const guestName = [firstName, lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className={cn(dash.card, "border border-zinc-100 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm overflow-hidden")}>
      <div className="px-3.5 pt-3 pb-2.5 border-b border-zinc-100/80">
        <p className="text-[14px] font-semibold text-zinc-800 tracking-tight leading-snug">
          {t.stayAboutTitle}
        </p>
      </div>

      <div className="px-3.5 py-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-zinc-50/90 border border-zinc-100/80 px-3 py-2.5 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={cn(dash.icon, "bg-white border border-zinc-100 flex items-center justify-center shrink-0")}>
              <User className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
            </span>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{t.guest}</p>
          </div>
          <p className="text-[15px] font-semibold text-zinc-900 leading-snug truncate">{guestName}</p>
        </div>

        {roomNumber ? (
          <div className="rounded-xl bg-zinc-50/90 border border-zinc-100/80 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={cn(dash.icon, "bg-white border border-zinc-100 flex items-center justify-center shrink-0")}>
                <BedDouble className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
              </span>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{t.room}</p>
            </div>
            <p className="text-[18px] font-serif text-zinc-900 leading-none tracking-tight">{roomNumber}</p>
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-50/50 border border-dashed border-zinc-100 px-3 py-2.5 flex items-center justify-center">
            <p className="text-[12px] text-zinc-300">—</p>
          </div>
        )}
      </div>

      {(checkInDate || checkOutDate) && (
        <div className="px-3.5 pb-2.5 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
          <p className="text-[12px] text-zinc-600 font-medium">
            {formatDate(checkInDate)} — {formatDate(checkOutDate)}
          </p>
        </div>
      )}

      <div className="mx-3.5 mb-3 rounded-xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
        {guestKeyDisplay ? (
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <span className={cn(dash.icon, "bg-zinc-900/[0.04] border border-zinc-100 flex items-center justify-center shrink-0")}>
              <Key className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">
                {t.guestKeyLabel}
              </p>
              <p className="text-[13px] font-mono font-medium text-zinc-800 tracking-wide truncate">
                {guestKeyDisplay}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={t.copyKey}
              className={cn(
                "flex items-center gap-1 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-95 shrink-0",
                copied
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-900 text-white hover:bg-zinc-800",
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t.keyCopied}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {t.copyKey}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <span className={cn(dash.icon, "bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0")}>
              <Key className="w-4 h-4 text-zinc-300" strokeWidth={1.75} />
            </span>
            <p className="text-[12px] text-zinc-400">{t.noActiveKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}
