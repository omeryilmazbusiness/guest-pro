import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { ROUTES } from "@/lib/app-routes";

interface GuestLiveChatMessageAlertProps {
  open: boolean;
  preview: string | null;
  unreadCount: number;
  onDismiss: () => void | Promise<void>;
}

export function GuestLiveChatMessageAlert({
  open,
  preview,
  unreadCount,
  onDismiss,
}: GuestLiveChatMessageAlertProps) {
  const { t } = useLocale();
  const goTo = useTenantNav();

  if (!open || unreadCount <= 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="guest-live-chat-alert-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between bg-zinc-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h2 id="guest-live-chat-alert-title" className="text-[15px] font-semibold">
              {t.receptionLiveChatTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void onDismiss()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
            aria-label={t.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[14px] font-medium text-zinc-900">{t.receptionLiveChatNewMessage}</p>
          {preview ? (
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-zinc-500">
              “{preview}”
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={() => void onDismiss()}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[13px] font-medium text-zinc-600"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              void onDismiss();
              goTo(ROUTES.guestLiveChat);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-[13px] font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            {t.receptionLiveCta}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
