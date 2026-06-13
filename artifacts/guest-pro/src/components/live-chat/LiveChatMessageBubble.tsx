import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveChatMessage } from "@/lib/live-chat-api";

const iosSendSpring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 28,
  mass: 1.1,
};

const iosReceiveSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 1.05,
};

const USER_TICKS = 28;
const USER_TICK_MS = 26;

function useSendTypingEffect(text: string, active: boolean) {
  const total = text.length;
  const charsPerTick = Math.max(1, Math.ceil(total / USER_TICKS));
  const [length, setLength] = useState(active ? 0 : total);

  useEffect(() => {
    if (!active) {
      setLength(total);
      return;
    }
    setLength(0);
    const timer = setInterval(() => {
      setLength((prev) => Math.min(prev + charsPerTick, total));
    }, USER_TICK_MS);
    return () => clearInterval(timer);
  }, [text, total, charsPerTick, active]);

  return {
    displayed: text.slice(0, length),
    isDone: length >= total,
  };
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[5px] px-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[7px] w-[7px] rounded-full bg-zinc-400"
          animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}
    </span>
  );
}

export function LiveChatMessageBubble({
  message,
  isGuest,
  sentLabel,
  readLabel,
  locationLabel = "Shared location",
  openMapLabel = "Open in Maps",
  animate = false,
  animateSend = false,
}: {
  message: LiveChatMessage;
  isGuest: boolean;
  sentLabel: string;
  readLabel: string;
  locationLabel?: string;
  openMapLabel?: string;
  animate?: boolean;
  /** Slow iOS-style character reveal for outgoing guest messages */
  animateSend?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const isMine = isGuest ? message.senderRole === "guest" : message.senderRole === "staff";
  const isStaffSide = message.senderRole === "staff" || message.senderRole === "system";
  const isOutgoingGuest = isGuest && message.senderRole === "guest";
  const useSendEffect = animateSend && isOutgoingGuest && !reduceMotion;

  const { displayed, isDone } = useSendTypingEffect(message.content, useSendEffect);

  const guestRead = !!message.readByGuestAt;
  const staffRead = !!message.readByStaffAt;

  const read = isGuest
    ? message.senderRole === "guest"
      ? staffRead
      : guestRead
    : message.senderRole === "guest"
      ? staffRead
      : true;

  const isLocation = message.messageType === "location";
  const mapsUrl =
    message.metadata?.mapsUrl ??
    (message.metadata?.lat != null && message.metadata?.lng != null
      ? `https://maps.google.com/?q=${message.metadata.lat},${message.metadata.lng}`
      : null);

  const spring = isMine ? iosSendSpring : iosReceiveSpring;
  const shouldMotion = (animate || animateSend) && !reduceMotion;

  return (
    <motion.div
      className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}
      initial={
        shouldMotion
          ? {
              opacity: 0,
              y: isMine ? 16 : 18,
              x: isMine ? 14 : -14,
              scale: 0.94,
            }
          : false
      }
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={spring}
    >
      <div
        className={cn(
          "max-w-[85%] text-[15px] leading-relaxed",
          isMine
            ? read
              ? "rounded-[22px] rounded-br-[6px] bg-emerald-600 px-4 py-3 text-white shadow-[0_2px_8px_-2px_rgba(16,185,129,0.35)]"
              : "rounded-[22px] rounded-br-[6px] bg-zinc-900 px-4 py-3 text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),0_8px_20px_-8px_rgba(0,0,0,0.25)]"
            : isStaffSide
              ? "rounded-[22px] rounded-bl-[6px] border border-zinc-100/90 bg-white px-4 py-3.5 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_-8px_rgba(0,0,0,0.1)]"
              : "rounded-[22px] rounded-bl-[6px] border border-zinc-100/90 bg-zinc-50 px-4 py-3.5 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        )}
      >
        {isLocation && mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 font-medium underline-offset-2 hover:underline",
              isMine ? "text-white" : "text-sky-700",
            )}
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{locationLabel}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="sr-only">{openMapLabel}</span>
          </a>
        ) : useSendEffect ? (
          <>
            {displayed}
            {!isDone && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/40 align-middle" />
            )}
          </>
        ) : (
          message.content
        )}
      </div>
      {isMine && message.senderRole === "guest" && (
        <span
          className={cn(
            "px-1 text-[10px] font-medium",
            read ? "text-emerald-600" : "text-sky-500",
          )}
        >
          {read ? readLabel : sentLabel}
        </span>
      )}
    </motion.div>
  );
}

export function LiveChatTypingBubble({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex justify-start"
      initial={reduceMotion ? false : { opacity: 0, y: 12, x: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={iosReceiveSpring}
    >
      <div
        className={cn(
          "flex min-h-[44px] min-w-[68px] max-w-[85%] items-center rounded-[22px] rounded-bl-[6px]",
          "border border-zinc-100/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_-8px_rgba(0,0,0,0.1)]",
        )}
      >
        <TypingDots />
        <span className="sr-only">{label}</span>
      </div>
    </motion.div>
  );
}

export function LiveChatStaffInsightBubble({ insight }: { insight: string }) {
  return (
    <div className="ml-2 max-w-[88%] rounded-xl border border-zinc-100 bg-zinc-50/90 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
      {insight}
    </div>
  );
}
