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
  ChevronUp,
  Trash2,
  AlertCircle,
} from "lucide-react";
import type {
  ServiceRequest,
  ServiceRequestType,
  ServiceRequestStatus,
} from "@/lib/service-requests";
import {
  REQUEST_STATUS_LABELS,
  updateServiceRequestStatus,
  deleteServiceRequest,
} from "@/lib/service-requests";
import { buildDisplaySummary, buildDetailLines } from "@/lib/request-display";
import { toast } from "sonner";

// ─── Type config — soft minimal palette ───────────────────────────────────────

interface TypeConfig {
  icon: React.FC<{ className?: string }>;
  label: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

const TYPE_CONFIG: Record<ServiceRequestType, TypeConfig> = {
  FOOD_ORDER: {
    icon: UtensilsCrossed,
    label: "Yemek Siparişi",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-zinc-100",
  },
  SUPPORT_REQUEST: {
    icon: Bell,
    label: "Destek Talebi",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-500",
    borderColor: "border-zinc-100",
  },
  CARE_PROFILE_UPDATE: {
    icon: Heart,
    label: "Care About Me",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    borderColor: "border-zinc-100",
  },
  GENERAL_SERVICE_REQUEST: {
    icon: Layers,
    label: "Genel Talep",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-400",
    borderColor: "border-zinc-100",
  },
};

// ─── Status cycle: open → in_progress → resolved (one-way; resolved is terminal) ──


const FALLBACK_CONFIG: TypeConfig = {
  icon: Layers,
  label: 'Talep',
  iconBg: 'bg-zinc-100',
  iconColor: 'text-zinc-400',
  borderColor: 'border-zinc-100',
};
const STATUS_NEXT: Record<ServiceRequestStatus, ServiceRequestStatus | null> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: null,
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
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
    new Date(dateStr)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ServiceRequestCardProps {
  request: ServiceRequest;
  onStatusChange?: (updated: ServiceRequest) => void;
  onDelete?: (id: number) => void;
  presenceStatus?: "in_hotel" | "out_of_hotel" | "unknown";
}

export function ServiceRequestCard({
  request,
  onStatusChange,
  onDelete,
  presenceStatus,
}: ServiceRequestCardProps) {
  const [status, setStatus] = useState<ServiceRequestStatus>(request.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "deleting">("idle");

  const config = TYPE_CONFIG[request.requestType] ?? FALLBACK_CONFIG;
  const Icon = config.icon;
  const StatusIcon = STATUS_ICONS[status];
  const nextStatus = STATUS_NEXT[status];

  const displayText = buildDisplaySummary(request);
  const detailLines = buildDetailLines(request);

  const handleStatusAdvance = useCallback(async () => {
    if (!nextStatus) return;
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
  }, [nextStatus, request.id, onStatusChange]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteState("deleting");
    try {
      await deleteServiceRequest(request.id);
      onDelete?.(request.id);
      toast.success("Talep silindi");
    } catch {
      toast.error("Talep silinemedi");
      setDeleteState("idle");
    }
  }, [request.id, onDelete]);

  return (
    <div className={`bg-white rounded-2xl border ${config.borderColor} shadow-sm overflow-hidden`}>
      {/* ── Main row ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Guest + room */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-semibold text-zinc-800 leading-tight">
                {request.guestFirstName} {request.guestLastName}
              </p>
              {presenceStatus === "in_hotel" && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                  Otelde
                </span>
              )}
            </div>
            <span className="text-[16px] font-serif text-zinc-500 shrink-0">
              {request.roomNumber}
            </span>
          </div>

          {/* Summary */}
          <p className="text-[13px] text-zinc-600 leading-snug">{displayText}</p>
        </div>
      </div>

      {/* ── Expandable detail lines ───────────────────────────── */}
      {detailLines.length > 0 && (
        <>
          {isExpanded && (
            <div className="px-4 pb-2 pt-0 border-t border-zinc-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="pt-2.5 space-y-2">
                {detailLines.map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider w-16 shrink-0 pt-[3px]">
                      {label}
                    </p>
                    <p className="text-[12px] text-zinc-600 leading-snug flex-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setIsExpanded((e) => !e)}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-zinc-300 hover:text-zinc-400 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>{isExpanded ? "Gizle" : "Detay"}</span>
          </button>
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="px-4 pb-3.5 flex items-center justify-between gap-3 border-t border-zinc-50 pt-2.5">
        <p className="text-[11px] text-zinc-300">{formatRelativeTime(request.createdAt)}</p>

        <div className="flex items-center gap-2">
          {/* Delete — only for resolved */}
          {status === "resolved" && (
            <>
              {deleteState === "idle" && (
                <button
                  onClick={() => setDeleteState("confirming")}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-medium text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                  title="Sil"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              {deleteState === "confirming" && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-[11px] text-zinc-500">Sil?</span>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
                  >
                    Evet
                  </button>
                  <button
                    onClick={() => setDeleteState("idle")}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-400 hover:bg-zinc-50 transition-all"
                  >
                    Hayır
                  </button>
                </div>
              )}
              {deleteState === "deleting" && (
                <Loader2 className="w-3.5 h-3.5 text-zinc-300 animate-spin" />
              )}
            </>
          )}

          {/* Status advance button */}
          <button
            onClick={handleStatusAdvance}
            disabled={isUpdating || !nextStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 disabled:opacity-60 disabled:cursor-default ${STATUS_COLORS[status]}`}
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <StatusIcon className={`w-3 h-3 ${status === "in_progress" ? "animate-spin" : ""}`} />
            )}
            {REQUEST_STATUS_LABELS[status]}
            {nextStatus && <ChevronDown className="w-3 h-3 opacity-40" />}
          </button>
        </div>
      </div>
    </div>
  );
}
