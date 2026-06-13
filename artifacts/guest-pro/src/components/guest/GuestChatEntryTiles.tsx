import { MessageCircle, MessagesSquare, Siren } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { RememberMeIcon } from "@/components/guest/RememberMeIcon";

interface GuestChatEntryTilesProps {
  onStartConversation: () => void;
  onReceptionChat: () => void;
  onReceptionUrgent: () => void;
  onRememberMe: () => void;
  receptionUnreadCount?: number;
}

const entryButton = cn(
  "group flex flex-col items-center justify-center gap-3 py-2 px-1 text-center",
  "transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 rounded-2xl",
);

function TypingDots({ className }: { className?: string }) {
  return (
    <span className="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("guest-chat-typing-dot h-[5px] w-[5px] rounded-full", className)}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

function AnimatedConciergeIcon() {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
      <MessagesSquare
        className="guest-chat-entry-icon h-11 w-11 text-zinc-900"
        strokeWidth={1.5}
      />
      <TypingDots className="bg-zinc-900/70" />
    </span>
  );
}

function AnimatedReceptionIcon({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
      <span className="guest-reception-live-ring absolute inset-0" />
      <MessageCircle
        className="guest-chat-entry-icon relative z-[1] h-11 w-11 text-zinc-900"
        strokeWidth={1.5}
      />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 end-0 z-[2] flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : (
        <span className="absolute -top-0.5 end-0 z-[2] flex h-3 w-3 items-center justify-center rounded-full bg-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        </span>
      )}
    </span>
  );
}

function AnimatedUrgentReceptionIcon() {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
      <span className="guest-urgent-live-ring absolute inset-0" />
      <MessageCircle
        className="guest-chat-entry-icon relative z-[1] h-11 w-11 text-rose-600"
        strokeWidth={1.5}
      />
      <span className="absolute -top-0.5 end-0 z-[2] flex h-3 w-3 items-center justify-center rounded-full bg-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
      </span>
    </span>
  );
}

export { RememberMeIcon } from "@/components/guest/RememberMeIcon";

export function GuestChatEntryTiles({
  onStartConversation,
  onReceptionChat,
  onReceptionUrgent,
  onRememberMe,
  receptionUnreadCount = 0,
}: GuestChatEntryTilesProps) {
  const { t } = useLocale();
  const hasUnread = receptionUnreadCount > 0;

  return (
    <section aria-label={t.askSomethingLabel}>
      <div className="grid grid-cols-2 gap-x-1 gap-y-1">
        <button type="button" onClick={onStartConversation} className={entryButton}>
          <AnimatedConciergeIcon />
          <span className="block max-w-[9.5rem]">
            <span className="block text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
              {t.askSomethingTitle}
            </span>
          </span>
        </button>

        <button type="button" onClick={onReceptionChat} className={entryButton}>
          <AnimatedReceptionIcon unreadCount={receptionUnreadCount} />
          <span className="block max-w-[9.5rem]">
            <span className="block text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
              {t.receptionLiveChatTitle}
            </span>
            {hasUnread ? (
              <span className="mt-1 block text-[10px] font-medium leading-snug text-rose-600">
                {t.receptionLiveChatUnreadHint}
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t.receptionLiveBadge}
              </span>
            )}
          </span>
        </button>

        <button type="button" onClick={onRememberMe} className={entryButton}>
          <RememberMeIcon />
          <span className="block max-w-[9.5rem]">
            <span className="block text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
              {t.rememberMeTitle}
            </span>
          </span>
        </button>

        <button type="button" onClick={onReceptionUrgent} className={entryButton}>
          <AnimatedUrgentReceptionIcon />
          <span className="block max-w-[9.5rem]">
            <span className="block text-[14px] font-semibold leading-snug tracking-tight text-rose-600">
              {t.receptionUrgentTitle}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-rose-500">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {t.receptionUrgentBadge}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
