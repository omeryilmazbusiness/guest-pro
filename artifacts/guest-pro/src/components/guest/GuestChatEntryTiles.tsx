import { MessageCircle, MessagesSquare } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface GuestChatEntryTilesProps {
  onStartConversation: () => void;
  onReceptionChat: () => void;
}

const tileBase = cn(
  "flex flex-col gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-2.5 text-start",
  "transition-colors duration-200 hover:border-zinc-300/80 hover:bg-white active:scale-[0.99]",
);

export function GuestChatEntryTiles({
  onStartConversation,
  onReceptionChat,
}: GuestChatEntryTilesProps) {
  const { t } = useLocale();

  return (
    <section aria-label={t.askSomethingLabel}>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" onClick={onStartConversation} className={tileBase}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-700 ring-1 ring-zinc-200/60">
            <MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
          <span className="block min-w-0">
            <p className="text-[11px] font-medium leading-tight tracking-tight text-zinc-800 line-clamp-2">
              {t.askSomethingTitle}
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-zinc-400 line-clamp-1">
              {t.askSomethingSubtitle}
            </p>
          </span>
        </button>

        <button type="button" onClick={onReceptionChat} className={tileBase}>
          <span className="flex w-full items-center justify-between gap-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-700 ring-1 ring-zinc-200/60">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
            <span className="inline-flex items-center gap-0.5 text-[8px] font-medium text-emerald-600/90">
              <span className="h-1 w-1 rounded-full bg-emerald-500/80" />
              {t.receptionLiveBadge}
            </span>
          </span>
          <span className="block min-w-0">
            <p className="text-[11px] font-medium leading-tight tracking-tight text-zinc-800 line-clamp-2">
              {t.receptionLiveChatTitle}
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-zinc-400 line-clamp-1">
              {t.receptionLiveSubtitle}
            </p>
          </span>
        </button>
      </div>
    </section>
  );
}
