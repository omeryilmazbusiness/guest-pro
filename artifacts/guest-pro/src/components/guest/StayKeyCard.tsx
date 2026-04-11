import { useState, useCallback } from "react";
import { Copy, Check, Key, BedDouble, CalendarDays } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!guestKeyDisplay) return;
    try {
      await navigator.clipboard.writeText(guestKeyDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — textarea method
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
      return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(d));
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Konaklamanız hakkında
          </p>
          <p className="text-[15px] font-medium text-zinc-800 truncate">
            {firstName} {lastName}
          </p>
        </div>
        {roomNumber && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
              Oda
            </p>
            <div className="flex items-center gap-1.5 justify-end">
              <BedDouble className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[17px] font-serif text-zinc-900 leading-none">{roomNumber}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stay dates bar */}
      {(checkInDate || checkOutDate) && (
        <div className="px-6 pb-4 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <p className="text-[12px] text-zinc-400">
            {formatDate(checkInDate)} — {formatDate(checkOutDate)}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-zinc-50 mx-6" />

      {/* Key row */}
      {guestKeyDisplay ? (
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            <Key className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-0.5">
              Misafir Anahtarı
            </p>
            <p className="text-[13px] font-mono text-zinc-700 tracking-wider truncate">
              {guestKeyDisplay}
            </p>
          </div>
          <button
            onClick={handleCopy}
            aria-label="Anahtarı kopyala"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 touch-manipulation ${
              copied
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-zinc-50 text-zinc-500 border border-zinc-100 hover:bg-zinc-100 hover:text-zinc-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Kopyala
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            <Key className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <p className="text-[13px] text-zinc-400">Aktif anahtar bulunamadı</p>
        </div>
      )}
    </div>
  );
}
