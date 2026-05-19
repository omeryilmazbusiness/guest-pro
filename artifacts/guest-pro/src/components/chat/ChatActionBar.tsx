import { CheckCircle2, Loader2 } from "lucide-react";
import type { SuggestedChatAction } from "@/lib/chat-api";

interface ChatActionBarProps {
  action: SuggestedChatAction;
  onConfirm: () => void;
  onDismiss: () => void;
  isLoading: boolean;
  confirmLabel: string;
  dismissLabel: string;
  title: string;
}

export function ChatActionBar({
  action,
  onConfirm,
  onDismiss,
  isLoading,
  confirmLabel,
  dismissLabel,
  title,
}: ChatActionBarProps) {
  return (
    <div className="mx-4 mb-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-lg px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          {title}
        </p>
        <p className="text-[14px] text-zinc-800 leading-snug line-clamp-3">{action.summary}</p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-[14px] font-semibold disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-[14px] font-medium text-zinc-600"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
