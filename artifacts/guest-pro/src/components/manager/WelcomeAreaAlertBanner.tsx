/**
 * WelcomeAreaAlertBanner
 *
 * Floating top-of-screen notification that appears when anonymous guests
 * have called for help from the welcome (/welcoming) screen.
 *
 * • Polls /api/welcome-alerts every 20 seconds.
 * • Shows open (unacknowledged) alerts as a compact horizontal banner.
 * • Staff can acknowledge an individual alert with the check button.
 * • Auto-hides when all alerts are acknowledged.
 */

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hotel, Check, X } from "lucide-react";
import { listWelcomeAlerts, acknowledgeWelcomeAlert, type WelcomeAlert } from "@/lib/welcome-alerts";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  ru: "Русский",
  hi: "हिन्दी",
  ur: "اردو",
  ja: "日本語",
};

const POLL_INTERVAL_MS = 20_000;

// ─── Single alert pill ────────────────────────────────────────────────────────

function AlertPill({
  alert,
  onAcknowledge,
}: {
  alert: WelcomeAlert;
  onAcknowledge: (id: number) => void;
}) {
  const langLabel = LANGUAGE_LABELS[alert.selectedLanguage] ?? alert.selectedLanguage;
  const elapsed = Math.round((Date.now() - new Date(alert.createdAt).getTime()) / 60_000);
  const timeLabel = elapsed < 1 ? "just now" : `${elapsed}m ago`;

  return (
    <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
      <Hotel className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
      <span className="text-[12px] font-medium text-zinc-700 whitespace-nowrap">
        Welcome Area — {langLabel}
      </span>
      <span className="text-[10px] text-zinc-400 whitespace-nowrap">{timeLabel}</span>
      <button
        onClick={() => onAcknowledge(alert.id)}
        className="ml-1 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
        aria-label="Acknowledge"
        title="Mark as acknowledged"
      >
        <Check className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

interface WelcomeAreaAlertBannerProps {
  enabled: boolean;
}

export function WelcomeAreaAlertBanner({ enabled }: WelcomeAreaAlertBannerProps) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ["welcome-alerts"],
    queryFn: listWelcomeAlerts,
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 15_000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeWelcomeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-alerts"] });
    },
  });

  const openAlerts = (alerts ?? []).filter((a) => a.status === "open");

  // Un-dismiss when new alerts arrive
  const prevOpenCount = useRef(0);
  useEffect(() => {
    if (openAlerts.length > prevOpenCount.current) {
      setDismissed(false);
    }
    prevOpenCount.current = openAlerts.length;
  }, [openAlerts.length]);

  if (!enabled || openAlerts.length === 0 || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "flex items-center gap-2 px-4 py-2",
        "bg-zinc-50/95 backdrop-blur-sm border-b border-zinc-200",
        "animate-in slide-in-from-top-2 duration-200",
      )}
    >
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
        Welcome Area
      </span>

      {/* Horizontally scrollable alert pills */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
        {openAlerts.map((alert) => (
          <AlertPill
            key={alert.id}
            alert={alert}
            onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
          />
        ))}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
        aria-label="Dismiss welcome alerts banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
