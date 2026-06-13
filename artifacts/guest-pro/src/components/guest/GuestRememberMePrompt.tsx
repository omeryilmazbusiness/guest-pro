import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import {
  acknowledgeRememberMe,
  fetchRememberMePending,
  type RememberMePendingPrompt,
} from "@/lib/tracking";
import { notifyRememberMeChanged } from "@/hooks/use-remember-me-schedule";

const POLL_MS = 3_000;

export function GuestRememberMePrompt() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLocale();
  const [pending, setPending] = useState<RememberMePendingPrompt | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const enabled = isAuthenticated && user?.role === "guest";

  const syncPending = useCallback(async () => {
    if (!enabled) {
      setPending(null);
      return;
    }
    try {
      const next = await fetchRememberMePending();
      setPending(next);
      if (next) setSecondsLeft(next.secondsUntilEscalation);
    } catch {
      /* offline — keep current state */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void syncPending();
    const id = setInterval(() => void syncPending(), POLL_MS);
    return () => clearInterval(id);
  }, [enabled, syncPending]);

  useEffect(() => {
    if (!pending) return;
    const tick = () => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pending?.scheduleId]);

  const handleAck = async () => {
    if (!pending || submitting) return;
    setSubmitting(true);
    try {
      await acknowledgeRememberMe(pending.scheduleId);
      notifyRememberMeChanged();
      setPending(null);
    } catch {
      /* retry on next poll */
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled || !pending) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="remember-me-prompt-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Remember Me
          </p>
          <h2
            id="remember-me-prompt-title"
            className="mt-2 font-serif text-[18px] font-medium text-zinc-900"
          >
            {t.rememberMePromptTitle}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">{t.rememberMePromptBody}</p>
          <p className="mt-4 text-[13px] font-medium text-amber-700">
            {t.rememberMePromptCountdown.replace("{seconds}", String(secondsLeft))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleAck()}
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-[15px] font-medium text-white transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.rememberMePromptAck}
        </button>
      </div>
    </div>
  );
}
