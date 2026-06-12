import { useState, useCallback } from "react";
import {
  BedDouble,
  CalendarDays,
  Check,
  Copy,
  Key,
  User,
  Wifi,
  type LucideIcon,
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

const stayTile = cn(
  "flex flex-col items-center justify-start gap-2.5 py-2 px-2 text-center min-w-0 w-full",
);

const stayTileInteractive = cn(
  stayTile,
  "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-2xl",
);

function StayIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
      <Icon className="guest-chat-entry-icon h-10 w-10 text-white" strokeWidth={1.5} />
    </span>
  );
}

function CopyAction({ copied, label }: { copied: boolean; label: string }) {
  return (
    <span
      className={cn(
        "mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold tracking-wide transition-colors",
        copied
          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/35"
          : "bg-white text-zinc-950 shadow-sm ring-1 ring-white/10 hover:bg-zinc-100",
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} /> : <Copy className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
      {label}
    </span>
  );
}

function StayTile({
  icon,
  label,
  value,
  onClick,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onClick?: () => void;
  muted?: boolean;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(onClick ? stayTileInteractive : stayTile, muted && "opacity-55")}
    >
      <StayIcon icon={icon} />
      <span className="block w-full">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </span>
        <span className="mt-1 block text-[14px] font-semibold leading-snug tracking-tight text-white break-words">
          {value}
        </span>
      </span>
    </Wrapper>
  );
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
  const dateRange =
    checkInDate || checkOutDate
      ? [formatDate(checkInDate), formatDate(checkOutDate)].filter(Boolean).join(" — ")
      : null;

  const wifiNetwork = guestWifi?.name?.trim() || null;
  const wifiPassword = guestWifi?.wifiPassword || null;

  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.08]">
      <div className="border-b border-white/[0.06] px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {t.stayAboutTitle}
        </p>
      </div>

      <div className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-x-1 gap-y-2">
          {roomNumber ? (
            <StayTile icon={BedDouble} label={t.room} value={roomNumber} />
          ) : null}

          <StayTile icon={User} label={t.guest} value={guestName} />

          {showWifi ? (
            <button
              type="button"
              onClick={() => wifiCopy.copy(wifiPassword!)}
              className={stayTileInteractive}
            >
              <StayIcon icon={Wifi} />
              <span className="block w-full">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {t.stayWifiTitle}
                </span>
                {wifiNetwork ? (
                  <span className="mt-1.5 block w-full">
                    <span className="block text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                      {t.stayWifiNetwork}
                    </span>
                    <span className="mt-0.5 block font-mono text-[12px] font-medium leading-relaxed text-zinc-200 break-all">
                      {wifiNetwork}
                    </span>
                  </span>
                ) : null}
                {wifiPassword ? (
                  <span className="mt-1.5 block w-full">
                    <span className="block text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                      {t.stayWifiPasswordLabel}
                    </span>
                    <span className="mt-0.5 block font-mono text-[13px] font-semibold leading-relaxed text-white break-all">
                      {wifiPassword}
                    </span>
                  </span>
                ) : null}
                <CopyAction
                  copied={wifiCopy.copied}
                  label={wifiCopy.copied ? t.stayWifiCopied : t.stayWifiCopy}
                />
              </span>
            </button>
          ) : null}

          {guestKeyDisplay ? (
            <button
              type="button"
              onClick={() => keyCopy.copy(guestKeyDisplay)}
              className={stayTileInteractive}
            >
              <StayIcon icon={Key} />
              <span className="block w-full">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {t.guestKeyLabel}
                </span>
                <span className="mt-1 block w-full font-mono text-[13px] font-semibold leading-relaxed text-white break-all">
                  {guestKeyDisplay}
                </span>
                <CopyAction
                  copied={keyCopy.copied}
                  label={keyCopy.copied ? t.keyCopied : t.copyKey}
                />
              </span>
            </button>
          ) : (
            <StayTile icon={Key} label={t.guestKeyLabel} value={t.noActiveKey} muted />
          )}
        </div>

        {dateRange ? (
          <div className="mt-3 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-4 text-center">
            <span className="relative inline-flex h-12 w-12 items-center justify-center" aria-hidden>
              <CalendarDays
                className="guest-chat-entry-icon h-9 w-9 text-white"
                strokeWidth={1.5}
              />
            </span>
            <span className="text-[13px] font-semibold tracking-tight text-white">{dateRange}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {t.stayActive}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
