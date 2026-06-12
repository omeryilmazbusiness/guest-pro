import { MessageCircle, MessagesSquare } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface GuestChatEntryTilesProps {
  onStartConversation: () => void;
  onReceptionChat: () => void;
}

const entryButton = cn(
  "group flex flex-col items-center justify-center gap-3 py-2 px-1 text-center",
  "transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 rounded-2xl",
);

function AnimatedConciergeIcon() {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
      <MessagesSquare
        className="guest-chat-entry-icon h-11 w-11 text-zinc-900"
        strokeWidth={1.5}
      />
      <span className="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="guest-chat-typing-dot h-[5px] w-[5px] rounded-full bg-zinc-900/70"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
    </span>
  );
}

function AnimatedReceptionIcon() {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center" aria-hidden>
      <span className="guest-reception-live-ring absolute inset-0" />
      <MessageCircle
        className="guest-chat-entry-icon relative z-[1] h-11 w-11 text-zinc-900"
        strokeWidth={1.5}
      />
      <span className="absolute -top-0.5 end-0 z-[2] flex h-3 w-3 items-center justify-center rounded-full bg-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      </span>
    </span>
  );
}

export function GuestChatEntryTiles({
  onStartConversation,
  onReceptionChat,
}: GuestChatEntryTilesProps) {
  const { t } = useLocale();

  return (
    <section aria-label={t.askSomethingLabel}>
      <div className="grid grid-cols-2 gap-1">
        <button type="button" onClick={onStartConversation} className={entryButton}>
          <AnimatedConciergeIcon />
          <span className="block max-w-[9.5rem]">
            <span className="block text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
              {t.askSomethingTitle}
            </span>
          </span>
        </button>

        <button type="button" onClick={onReceptionChat} className={entryButton}>
          <AnimatedReceptionIcon />
          <span className="block max-w-[9.5rem]">
            <span className="block text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
              {t.receptionLiveChatTitle}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t.receptionLiveBadge}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
