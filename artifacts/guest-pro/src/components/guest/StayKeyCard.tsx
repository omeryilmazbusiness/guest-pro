import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Key,
  BedDouble,
  CalendarDays,
  User,
  Wifi,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useGuestFloorWifi } from "@/hooks/use-guest-floor-wifi";
import { cn } from "@/lib/utils";

interface StayKeyCardProps {
  guestKeyDisplay?: string | null;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  firstName?: string;
  lastName?: string;
}

function useCopyText() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copied, copy };
}

export function StayKeyCard({
  guestKeyDisplay,
  roomNumber,
  checkInDate,
  checkOutDate,
  firstName,
  lastName,
}: StayKeyCardProps) {
  const { t, uiLocale } = useLocale();
  const { data: floorWifi } = useGuestFloorWifi(!!roomNumber);
  const keyCopy = useCopyText();
  const wifiCopy = useCopyText();

  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      return new Intl.DateTimeFormat(uiLocale, { day: "numeric", month: "short" }).format(
        new Date(d),
      );
    } catch {
      return d;
    }
  };

  const guestName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const showWifi = floorWifi?.configured && floorWifi.wifiPassword;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl shadow-zinc-950/25">
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(ellipse_90%_70%_at_100%_0%,rgba(255,255,255,0.35),transparent_55%)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_0%_100%,rgba(251,191,36,0.5),transparent_45%)]"
        aria-hidden
      />

      <div className="relative px-4 pt-4 pb-3 border-b border-white/[0.06] flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400/90 shrink-0" strokeWidth={1.75} />
        <p className="font-serif text-[15px] font-medium text-white tracking-tight">
          {t.stayAboutTitle}
        </p>
      </div>

      <div className="relative px-3.5 py-3 grid grid-cols-2 gap-2">
        <InfoTile
          icon={User}
          label={t.guest}
          value={guestName}
          valueClassName="text-[14px] font-semibold truncate"
        />
        {roomNumber ? (
          <InfoTile
            icon={BedDouble}
            label={t.room}
            value={roomNumber}
            valueClassName="text-[20px] font-serif text-white leading-none"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-2.5 flex items-center justify-center min-h-[72px]">
            <p className="text-[12px] text-zinc-600">—</p>
          </div>
        )}
      </div>

      {(checkInDate || checkOutDate) && (
        <div className="relative px-4 pb-3 flex items-center gap-2 text-zinc-400">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          <p className="text-[12px] font-medium">
            {formatDate(checkInDate)} — {formatDate(checkOutDate)}
          </p>
        </div>
      )}

      {showWifi && (
        <div className="relative mx-3.5 mb-3 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] to-transparent p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/20">
              <Wifi className="h-4 w-4 text-amber-300" strokeWidth={1.75} />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200/70">
              {t.stayWifiTitle}
            </p>
          </div>

          {floorWifi!.wifiSsid && (
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-zinc-500 mb-1">{t.stayWifiNetwork}</p>
              <p className="font-mono text-[14px] font-semibold text-white tracking-wide truncate">
                {floorWifi!.wifiSsid}
              </p>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[10px] font-medium text-zinc-500 mb-1">{t.stayWifiPasswordLabel}</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 min-w-0 font-mono text-[15px] font-semibold text-white tracking-wide truncate">
                {floorWifi!.wifiPassword}
              </p>
              <button
                type="button"
                onClick={() => wifiCopy.copy(floorWifi!.wifiPassword!)}
                className={cn(
                  "shrink-0 flex items-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold transition-all active:scale-95",
                  wifiCopy.copied
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-white/10 text-white hover:bg-white/15",
                )}
              >
                {wifiCopy.copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {t.stayWifiCopied}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {t.stayWifiCopy}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative mx-3.5 mb-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
        {guestKeyDisplay ? (
          <div className="px-3.5 py-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
              <Key className="w-4 h-4 text-zinc-300" strokeWidth={1.75} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">
                {t.guestKeyLabel}
              </p>
              <p className="text-[13px] font-mono font-medium text-zinc-200 tracking-wide truncate">
                {guestKeyDisplay}
              </p>
            </div>
            <button
              type="button"
              onClick={() => keyCopy.copy(guestKeyDisplay)}
              aria-label={t.copyKey}
              className={cn(
                "flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 shrink-0",
                keyCopy.copied
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "bg-white text-zinc-950 hover:bg-zinc-100",
              )}
            >
              {keyCopy.copied ? (
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
          <div className="px-3.5 py-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
              <Key className="w-4 h-4 text-zinc-600" strokeWidth={1.75} />
            </span>
            <p className="text-[12px] text-zinc-500">{t.noActiveKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={1.75} />
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn("text-zinc-100 leading-snug", valueClassName)}>{value}</p>
    </div>
  );
}
