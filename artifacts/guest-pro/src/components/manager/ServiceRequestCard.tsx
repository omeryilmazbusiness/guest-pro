import { useState, useCallback } from "react";
import {
  UtensilsCrossed,
  Bell,
  Heart,
  Layers,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type {
  ServiceRequest,
  ServiceRequestType,
  ServiceRequestStatus,
} from "@/lib/service-requests";
import { REQUEST_STATUS_LABELS, updateServiceRequestStatus } from "@/lib/service-requests";
import { toast } from "sonner";

// ─── Type config ──────────────────────────────────────────────────────────────

interface TypeConfig {
  icon: React.FC<{ className?: string }>;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  headerBg: string;
  iconBg: string;
  iconColor: string;
}

const TYPE_CONFIG: Record<ServiceRequestType, TypeConfig> = {
  FOOD_ORDER: {
    icon: UtensilsCrossed,
    label: "Yemek Siparişi",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    borderColor: "border-amber-200",
    headerBg: "bg-amber-50/60",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  SUPPORT_REQUEST: {
    icon: Bell,
    label: "Destek Talebi",
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-700",
    borderColor: "border-yellow-300",
    headerBg: "bg-yellow-50/70",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  CARE_PROFILE_UPDATE: {
    icon: Heart,
    label: "Care About Me",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
    borderColor: "border-rose-200",
    headerBg: "bg-rose-50/50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
  GENERAL_SERVICE_REQUEST: {
    icon: Layers,
    label: "Genel Talep",
    badgeBg: "bg-zinc-100",
    badgeText: "text-zinc-600",
    borderColor: "border-zinc-200",
    headerBg: "bg-zinc-50",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-500",
  },
};

const STATUS_CYCLE: Record<ServiceRequestStatus, ServiceRequestStatus> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "open",
};

const STATUS_ICONS: Record<ServiceRequestStatus, React.FC<{ className?: string }>> = {
  open: Clock,
  in_progress: Loader2,
  resolved: CheckCircle2,
};

const STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  open: "text-zinc-500 bg-zinc-50 border-zinc-200",
  in_progress: "text-blue-600 bg-blue-50 border-blue-200",
  resolved: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(dateStr));
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ServiceRequestCardProps {
  request: ServiceRequest;
  onStatusChange?: (updated: ServiceRequest) => void;
  presenceStatus?: "in_hotel" | "out_of_hotel" | "unknown";
}

export function ServiceRequestCard({
  request,
  onStatusChange,
  presenceStatus,
}: ServiceRequestCardProps) {
  const [status, setStatus] = useState<ServiceRequestStatus>(request.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const config = TYPE_CONFIG[request.requestType];
  const Icon = config.icon;
  const StatusIcon = STATUS_ICONS[status];

  const handleStatusCycle = useCallback(async () => {
    const nextStatus = STATUS_CYCLE[status];
    setIsUpdating(true);
    try {
      const updated = await updateServiceRequestStatus(request.id, nextStatus);
      setStatus(nextStatus);
      onStatusChange?.(updated);
    } catch {
      toast.error("Durum güncellenemedi");
    } finally {
      setIsUpdating(false);
    }
  }, [status, request.id, onStatusChange]);

  return (
    <div
      className={`bg-white rounded-2xl border ${config.borderColor} shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div className={`${config.headerBg} px-4 pt-3.5 pb-3 flex items-center gap-3`}>
        <div className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}
            >
              {config.label}
            </span>
            {presenceStatus === "in_hotel" && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Otelde
              </span>
            )}
            {presenceStatus === "out_of_hotel" && (
              <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">
                Dışarıda
              </span>
            )}
          </div>
          <p className="text-[13px] font-semibold text-zinc-800 mt-0.5 leading-snug">
            {request.guestFirstName} {request.guestLastName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[17px] font-serif text-zinc-700 leading-none">{request.roomNumber}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Oda</p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3">
        <p className="text-[13px] text-zinc-700 leading-relaxed">{request.summary}</p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3.5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-400">{formatRelativeTime(request.createdAt)}</p>
        <button
          onClick={handleStatusCycle}
          disabled={isUpdating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${STATUS_COLORS[status]}`}
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <StatusIcon className={`w-3 h-3 ${status === "in_progress" ? "animate-spin" : ""}`} />
          )}
          {REQUEST_STATUS_LABELS[status]}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </div>
    </div>
  );
}
