import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/hooks/use-locale";
import { scheduleEntryTrack } from "@/lib/tracking";
import { notifyRememberMeChanged } from "@/hooks/use-remember-me-schedule";
import { RememberMeIcon } from "@/components/guest/RememberMeIcon";
import { RememberMeDateTimePicker } from "@/components/guest/RememberMeDateTimePicker";
import {
  defaultRememberMeParts,
  minRememberMeTimestampMs,
  rememberMePartsToDate,
  type RememberMeMinute,
} from "@/lib/remember-me-datetime";

interface GuestRememberMeModalProps {
  open: boolean;
  onClose: () => void;
}

function parseApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data: unknown }).data;
    if (data && typeof data === "object" && "error" in data) {
      const message = (data as { error: unknown }).error;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function GuestRememberMeModal({ open, onClose }: GuestRememberMeModalProps) {
  const { t, uiLocale } = useLocale();
  const [parts, setParts] = useState(defaultRememberMeParts);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setParts(defaultRememberMeParts());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const handleSubmit = async () => {
    const picked = rememberMePartsToDate(parts.dayKey, parts.hour24, parts.minute);
    if (Number.isNaN(picked.getTime())) {
      toast.error(t.rememberMeError);
      return;
    }
    if (picked.getTime() < minRememberMeTimestampMs()) {
      toast.error(t.rememberMeTimeTooSoon);
      return;
    }

    setSubmitting(true);
    try {
      await scheduleEntryTrack(picked.toISOString());
      notifyRememberMeChanged();
      toast.success(t.rememberMeScheduled);
      onClose();
    } catch (err) {
      toast.error(parseApiError(err, t.rememberMeError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (dayKey: string, hour24: number, minute: RememberMeMinute) => {
    setParts({ dayKey, hour24, minute });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remember-me-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" aria-hidden />

        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <RememberMeIcon />
          </div>
          <h3 id="remember-me-modal-title" className="font-serif text-[17px] font-medium text-zinc-900">
            {t.rememberMeModalTitle}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{t.rememberMeModalBody}</p>
        </div>

        <div className="mb-5">
          <span className="mb-2 block text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {t.rememberMeModalTimeLabel}
          </span>
          <RememberMeDateTimePicker
            dayKey={parts.dayKey}
            hour24={parts.hour24}
            minute={parts.minute}
            locale={uiLocale}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-[15px] font-medium text-white transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.rememberMeModalSubmit}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full rounded-2xl py-3 text-[15px] font-medium text-zinc-500 transition-colors hover:text-zinc-700"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
