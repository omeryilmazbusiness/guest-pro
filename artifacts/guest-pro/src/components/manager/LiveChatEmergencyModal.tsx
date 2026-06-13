/**
 * LiveChatEmergencyModal — compact urgent alert card for reception.
 */
import { AlertTriangle, MessageCircle, X } from "lucide-react";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { cn } from "@/lib/utils";
import type { LiveChatEmergencyEvent, LiveChatInboxItem } from "@/lib/live-chat-api";

type EmergencyItem = LiveChatInboxItem | LiveChatEmergencyEvent;

function isWarning(item: EmergencyItem): boolean {
  return "severity" in item && item.severity === "warning";
}

export function LiveChatEmergencyModal({
  item,
  stackIndex = 0,
  stackTotal = 1,
  embedded = false,
  compact = false,
  onGoToChat,
  onDismiss,
}: {
  item: EmergencyItem;
  stackIndex?: number;
  stackTotal?: number;
  embedded?: boolean;
  compact?: boolean;
  onGoToChat: () => void;
  onDismiss: () => void;
}) {
  const { t } = useStaffLocale();
  const warning = isWarning(item);
  const guestName = [item.guestFirstName, item.guestLastName].filter(Boolean).join(" ") || "—";
  const sessionId = item.sessionId;

  const code = warning ? t.liveChatWarningCode : t.liveChatEmergencyCode;
  const title = warning ? t.liveChatWarningTitle : t.liveChatEmergencyTitle;
  const body = (warning ? t.liveChatWarningBody : t.liveChatEmergencyBody)
    .replace("{room}", item.roomNumber)
    .replace("{name}", guestName);

  const card = (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border-2 bg-white",
        warning
          ? "border-amber-400 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.35)]"
          : "border-rose-400 shadow-[0_8px_24px_-8px_rgba(244,63,94,0.35)]",
        compact ? "animate-in slide-in-from-top-2 duration-300" : "rounded-2xl shadow-2xl",
      )}
      role="alertdialog"
      aria-labelledby={`live-chat-emergency-title-${sessionId}`}
    >
      <div
        className={cn(
          "text-white",
          warning ? "bg-amber-500" : "bg-rose-600",
          compact ? "px-3 py-2" : "px-5 py-4",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <AlertTriangle className={cn("shrink-0", compact ? "h-4 w-4" : "h-5 w-5")} />
            <h2
              id={`live-chat-emergency-title-${sessionId}`}
              className={cn("font-bold tracking-wide", compact ? "text-[12px]" : "text-[16px]")}
            >
              {code}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {stackTotal > 1 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                {stackIndex + 1}/{stackTotal}
              </span>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-6 w-6 items-center justify-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
              aria-label={t.liveChatEmergencyDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className={compact ? "px-3 py-2" : "px-5 py-4"}>
        <p className={cn("font-semibold text-zinc-900", compact ? "text-[11px]" : "text-[14px]")}>
          {title}
        </p>
        <p
          className={cn(
            "mt-1 leading-snug text-zinc-600",
            compact ? "text-[10px] line-clamp-2" : "mt-2 text-[13px] leading-relaxed",
          )}
        >
          {body}
        </p>
      </div>
      <div className={cn("flex gap-1.5 border-t border-zinc-100", compact ? "px-3 py-2" : "gap-2 px-5 py-4")}>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "flex-1 rounded-lg border border-zinc-200 font-medium text-zinc-600",
            compact ? "py-1.5 text-[10px]" : "rounded-xl py-2.5 text-[13px]",
          )}
        >
          {t.liveChatEmergencyDismiss}
        </button>
        <button
          type="button"
          onClick={onGoToChat}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-lg font-semibold text-white",
            warning ? "bg-amber-500" : "bg-rose-600",
            compact ? "py-1.5 text-[10px]" : "gap-1.5 rounded-xl py-2.5 text-[13px]",
          )}
        >
          <MessageCircle className={compact ? "h-3 w-3" : "h-4 w-4"} />
          {t.liveChatEmergencyGoToChat}
        </button>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md">{card}</div>
    </div>
  );
}
