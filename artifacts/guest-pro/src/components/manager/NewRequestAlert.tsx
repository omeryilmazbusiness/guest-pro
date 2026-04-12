/**
 * NewRequestAlert
 *
 * Top-of-screen sliding banner that appears when new service requests
 * arrive while the staff user is on any dashboard tab.
 *
 * Architecture:
 *  - Polls /api/requests every 15s (shared query key with the board)
 *  - On first load: marks all existing request IDs as "seen" — no alerts
 *  - On subsequent polls: new IDs trigger alert banners
 *  - Banners auto-dismiss after 7 seconds; can be manually closed
 *  - Clicking a banner navigates to the Requests tab
 *  - Max 3 banners shown simultaneously; oldest slides out first
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, UtensilsCrossed, Bell, Heart, LayoutGrid } from "lucide-react";
import {
  listServiceRequests,
  type ServiceRequest,
  type ServiceRequestType,
} from "@/lib/service-requests";
import { buildDisplaySummary } from "@/lib/request-display";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertEntry {
  alertId: string;
  request: ServiceRequest;
  expiresAt: number;
}

// ─── Category icon map ────────────────────────────────────────────────────────

const TYPE_ICON: Record<ServiceRequestType, React.FC<{ className?: string }>> = {
  FOOD_ORDER: UtensilsCrossed,
  SUPPORT_REQUEST: Bell,
  CARE_PROFILE_UPDATE: Heart,
  GENERAL_SERVICE_REQUEST: LayoutGrid,
};

const TYPE_ACCENT: Record<ServiceRequestType, { dot: string; iconBg: string; iconColor: string }> = {
  FOOD_ORDER: { dot: "bg-amber-400", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  SUPPORT_REQUEST: { dot: "bg-sky-400", iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  CARE_PROFILE_UPDATE: { dot: "bg-rose-400", iconBg: "bg-rose-50", iconColor: "text-rose-500" },
  GENERAL_SERVICE_REQUEST: { dot: "bg-zinc-400", iconBg: "bg-zinc-100", iconColor: "text-zinc-500" },
};

const TYPE_LABELS: Record<ServiceRequestType, string> = {
  FOOD_ORDER: "Yemek Siparişi",
  SUPPORT_REQUEST: "Destek Talebi",
  CARE_PROFILE_UPDATE: "Care About Me",
  GENERAL_SERVICE_REQUEST: "Genel Talep",
};

const ALERT_DURATION_MS = 7_000;

// ─── Single Banner ────────────────────────────────────────────────────────────

function AlertBanner({
  entry,
  onDismiss,
  onClick,
}: {
  entry: AlertEntry;
  onDismiss: (alertId: string) => void;
  onClick: () => void;
}) {
  const { request } = entry;
  const Icon = TYPE_ICON[request.requestType] ?? LayoutGrid;
  const accent = TYPE_ACCENT[request.requestType] ?? TYPE_ACCENT.GENERAL_SERVICE_REQUEST;
  const label = TYPE_LABELS[request.requestType];
  const displayText = buildDisplaySummary(request);

  return (
    <div
      className="
        flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl
        shadow-lg shadow-zinc-900/8 px-4 py-3 animate-in slide-in-from-top-2
        fade-in duration-300 pointer-events-auto cursor-pointer
        hover:border-zinc-300 transition-colors
      "
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Live dot */}
      <div className="relative shrink-0">
        <div className={`w-2 h-2 rounded-full ${accent.dot} animate-pulse`} />
      </div>

      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-xl ${accent.iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-4 h-4 ${accent.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {label}
          </p>
          {request.roomNumber && (
            <span className="text-[11px] font-mono text-zinc-300">· {request.roomNumber}</span>
          )}
        </div>
        <p className="text-[13px] font-medium text-zinc-800 leading-tight truncate">
          {displayText}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(entry.alertId);
        }}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 transition-all shrink-0 -mr-1"
        aria-label="Kapat"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export interface NewRequestAlertProps {
  onNavigateToRequests: () => void;
  enabled: boolean;
}

export function NewRequestAlert({ onNavigateToRequests, enabled }: NewRequestAlertProps) {
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const knownIds = useRef<Set<number>>(new Set());
  const isInitialized = useRef(false);

  const { data: requests } = useQuery<ServiceRequest[]>({
    queryKey: ["service-requests-alert-poll"],
    queryFn: () => listServiceRequests(),
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled,
  });

  useEffect(() => {
    if (!requests) return;

    if (!isInitialized.current) {
      requests.forEach((r) => knownIds.current.add(r.id));
      isInitialized.current = true;
      return;
    }

    const newOnes = requests.filter((r) => !knownIds.current.has(r.id));
    if (newOnes.length === 0) return;

    newOnes.forEach((r) => knownIds.current.add(r.id));

    const newAlerts: AlertEntry[] = newOnes.map((r) => ({
      alertId: `${r.id}-${Date.now()}`,
      request: r,
      expiresAt: Date.now() + ALERT_DURATION_MS,
    }));

    setAlerts((prev) => [...prev, ...newAlerts].slice(-3));

    queryClient.invalidateQueries({ queryKey: ["service-requests"] });
  }, [requests, queryClient]);

  useEffect(() => {
    if (alerts.length === 0) return;
    const oldest = alerts[0];
    const remaining = oldest.expiresAt - Date.now();
    if (remaining <= 0) {
      setAlerts((prev) => prev.slice(1));
      return;
    }
    const timer = setTimeout(() => {
      setAlerts((prev) => prev.slice(1));
    }, remaining);
    return () => clearTimeout(timer);
  }, [alerts]);

  const dismiss = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
  }, []);

  if (alerts.length === 0 || !enabled) return null;

  return (
    <div className="fixed top-14 inset-x-0 z-50 pointer-events-none">
      <div className="max-w-2xl mx-auto px-4 pt-2 space-y-1.5">
        {alerts.map((entry) => (
          <AlertBanner
            key={entry.alertId}
            entry={entry}
            onDismiss={dismiss}
            onClick={onNavigateToRequests}
          />
        ))}
      </div>
    </div>
  );
}
