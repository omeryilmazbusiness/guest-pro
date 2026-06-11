import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Key,
  BedDouble,
  CalendarDays,
  User,
  Wifi,
} from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useGuestWifi } from "@/hooks/use-guest-wifi";
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
  const { data: guestWifi } = useGuestWifi(true);
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
  const showWifi = guestWifi?.configured && guestWifi.wifiPassword;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-white/[0.06] px-3 py-2">
        <p className="text-[11px] font-medium tracking-tight text-zinc-300">{t.stayAboutTitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 px-2.5 py-2">
        <InfoTile
          icon={User}
          label={t.guest}
          value={guestName}
          valueClassName="text-[12px] font-medium truncate"
        />
        {roomNumber ? (
          <InfoTile
            icon={BedDouble}
            label={t.room}
            value={roomNumber}
            valueClassName="text-[15px] font-medium text-white leading-none"
          />
        ) : (
          <div className="flex min-h-[52px] items-center justify-center rounded-lg border border-dashed border-white/10 px-2 py-2">
            <p className="text-[10px] text-zinc-600">—</p>
          </div>
        )}
      </div>

      {(checkInDate || checkOutDate) && (
        <div className="flex items-center gap-1.5 px-3 pb-2 text-zinc-500">
          <CalendarDays className="h-3 w-3 shrink-0" strokeWidth={1.5} />
          <p className="text-[10px] font-medium">
            {formatDate(checkInDate)} — {formatDate(checkOutDate)}
          </p>
        </div>
      )}

      {showWifi && (
        <div className="mx-2.5 mb-2 space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-zinc-400">
              <Wifi className="h-3 w-3" strokeWidth={1.5} />
            </span>
            <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">
              {t.stayWifiTitle}
            </p>
          </div>

          {guestWifi!.name && (
            <div className="min-w-0">
              <p className="mb-0.5 text-[9px] font-medium text-zinc-600">{t.stayWifiNetwork}</p>
              <p className="truncate font-mono text-[11px] font-medium text-zinc-200">
                {guestWifi!.name}
              </p>
            </div>
          )}

          <div className="min-w-0">
            <p className="mb-0.5 text-[9px] font-medium text-zinc-600">{t.stayWifiPasswordLabel}</p>
            <div className="flex items-center gap-1.5">
              <p className="min-w-0 flex-1 truncate font-mono text-[12px] font-medium text-zinc-200">
                {guestWifi!.wifiPassword}
              </p>
              <button
                type="button"
                onClick={() => wifiCopy.copy(guestWifi!.wifiPassword!)}
                className={cn(
                  "flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-[9px] font-medium transition-colors active:scale-95",
                  wifiCopy.copied
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]",
                )}
              >
                {wifiCopy.copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    {t.stayWifiCopied}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    {t.stayWifiCopy}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-2.5 mb-2.5 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
        {guestKeyDisplay ? (
          <div className="flex items-center gap-2 px-2.5 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-zinc-400">
              <Key className="h-3 w-3" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                {t.guestKeyLabel}
              </p>
              <p className="truncate font-mono text-[11px] font-medium text-zinc-300">
                {guestKeyDisplay}
              </p>
            </div>
            <button
              type="button"
              onClick={() => keyCopy.copy(guestKeyDisplay)}
              aria-label={t.copyKey}
              className={cn(
                "flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-[9px] font-medium transition-colors active:scale-95",
                keyCopy.copied
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white text-zinc-900 hover:bg-zinc-100",
              )}
            >
              {keyCopy.copied ? (
                <>
                  <Check className="h-3 w-3" />
                  {t.keyCopied}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  {t.copyKey}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-600">
              <Key className="h-3 w-3" strokeWidth={1.5} />
            </span>
            <p className="text-[10px] text-zinc-500">{t.noActiveKey}</p>
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
    <div className="min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0 text-zinc-600" strokeWidth={1.5} />
        <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-600">{label}</p>
      </div>
      <p className={cn("leading-snug text-zinc-200", valueClassName)}>{value}</p>
    </div>
  );
}
