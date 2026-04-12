import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listServiceRequests,
  deleteServiceRequest,
  REQUEST_TYPE_LABELS,
  type ServiceRequest,
  type ServiceRequestType,
} from "@/lib/service-requests";
import { buildDisplaySummary } from "@/lib/request-display";
import { ServiceRequestCard } from "./ServiceRequestCard";
import {
  RefreshCw,
  Inbox,
  UtensilsCrossed,
  Bell,
  Heart,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { TrackingStatus } from "@/lib/tracking";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffRequestsBoardProps {
  presenceMap: Map<number, TrackingStatus>;
  onOpenCountChange?: (count: number) => void;
}

// ─── Group config — soft neutral palette ─────────────────────────────────────

interface GroupConfig {
  type: ServiceRequestType;
  label: string;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  dotColor: string;
}

const GROUPS: GroupConfig[] = [
  {
    type: "FOOD_ORDER",
    label: "Yemek Siparişleri",
    icon: UtensilsCrossed,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    dotColor: "bg-amber-400",
  },
  {
    type: "SUPPORT_REQUEST",
    label: "Destek Talepleri",
    icon: Bell,
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-500",
    dotColor: "bg-zinc-400",
  },
  {
    type: "CARE_PROFILE_UPDATE",
    label: "Care About Me",
    icon: Heart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    dotColor: "bg-rose-400",
  },
  {
    type: "GENERAL_SERVICE_REQUEST",
    label: "Genel Talepler",
    icon: LayoutGrid,
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-400",
    dotColor: "bg-zinc-300",
  },
];

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Tamamlandı",
};

const STATUS_DOT: Record<string, string> = {
  open: "bg-red-400",
  in_progress: "bg-amber-400",
  resolved: "bg-emerald-400",
};

// ─── Presence helper ──────────────────────────────────────────────────────────

function presenceStatus(
  guestId: number,
  presenceMap: Map<number, TrackingStatus>
): "in_hotel" | "out_of_hotel" | "unknown" | undefined {
  const p = presenceMap.get(guestId);
  if (p === "IN_HOTEL_AND_ON_WIFI" || p === "IN_HOTEL_NOT_ON_WIFI") return "in_hotel";
  if (p === "OUTSIDE_HOTEL") return "out_of_hotel";
  if (p === "UNKNOWN") return "unknown";
  return undefined;
}

// ─── Group Stack Card ─────────────────────────────────────────────────────────

function GroupStackCard({
  group,
  requests,
  isExpanded,
  onToggle,
  presenceMap,
  onStatusChange,
  onDelete,
}: {
  group: GroupConfig;
  requests: ServiceRequest[];
  isExpanded: boolean;
  onToggle: () => void;
  presenceMap: Map<number, TrackingStatus>;
  onStatusChange: (updated: ServiceRequest) => void;
  onDelete: (id: number) => void;
}) {
  const IconComp = group.icon;
  const openCount = requests.filter((r) => r.status === "open").length;
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;
  const total = requests.length;
  const newest = requests[0];
  const stackLayers = Math.min(total, 3);

  const newestDisplay = newest ? buildDisplaySummary(newest) : "";

  return (
    <div className="space-y-2">
      {/* Card stack wrapper */}
      <div className="relative" style={{ paddingBottom: stackLayers >= 2 ? 8 : 0 }}>
        {/* Depth layer 3 — furthest back */}
        {stackLayers >= 3 && (
          <div
            className="absolute inset-x-5 bottom-0 rounded-2xl border border-zinc-100 bg-zinc-50/60"
            style={{ height: "calc(100% - 4px)", zIndex: 0 }}
          />
        )}
        {/* Depth layer 2 */}
        {stackLayers >= 2 && (
          <div
            className="absolute inset-x-2.5 bottom-2 rounded-2xl border border-zinc-100 bg-zinc-50/80"
            style={{ height: "calc(100% - 2px)", zIndex: 1 }}
          />
        )}

        {/* Main card */}
        <button
          onClick={onToggle}
          className={`relative w-full text-left rounded-2xl border transition-all active:scale-[0.99] touch-manipulation shadow-sm ${
            isExpanded
              ? "bg-white border-zinc-200 shadow-md"
              : "bg-white border-zinc-100 hover:border-zinc-200"
          }`}
          style={{ zIndex: 2 }}
        >
          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl ${group.iconBg} flex items-center justify-center shrink-0`}
              >
                <IconComp className={`w-4.5 h-4.5 ${group.iconColor}`} />
              </div>

              {/* Label + preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-semibold text-zinc-800">{group.label}</p>
                  {openCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                      {openCount} açık
                    </span>
                  )}
                  {inProgressCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                      {inProgressCount} işlemde
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate leading-tight">
                  {total === 0
                    ? "Talep yok"
                    : newestDisplay
                    ? newestDisplay.length > 52
                      ? newestDisplay.slice(0, 52) + "…"
                      : newestDisplay
                    : `${total} talep`}
                </p>
              </div>

              {/* Count + chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {total > 0 && (
                  <span className="text-[13px] font-semibold text-zinc-300">{total}</span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-300" />
                )}
              </div>
            </div>

            {/* Status dots mini-bar */}
            {total > 0 && (
              <div className="flex items-center gap-3 mt-3">
                {(["open", "in_progress", "resolved"] as const).map((s) => {
                  const count = requests.filter((r) => r.status === s).length;
                  if (count === 0) return null;
                  return (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                      <span className="text-[10px] text-zinc-400">
                        {count} {STATUS_LABELS[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Expanded request cards */}
      {isExpanded && total > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {requests.map((request) => (
            <ServiceRequestCard
              key={request.id}
              request={request}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              presenceStatus={presenceStatus(request.guestId, presenceMap)}
            />
          ))}
        </div>
      )}

      {isExpanded && total === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 bg-white rounded-2xl border border-zinc-100">
          <Inbox className="w-5 h-5 text-zinc-200" />
          <p className="text-[12px] text-zinc-400">Bu kategoride talep yok</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function StaffRequestsBoard({ presenceMap, onOpenCountChange }: StaffRequestsBoardProps) {
  const queryClient = useQueryClient();
  const [expandedGroup, setExpandedGroup] = useState<ServiceRequestType | null>(
    "SUPPORT_REQUEST"
  );

  const {
    data: requests,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["service-requests"],
    queryFn: () => listServiceRequests(),
    refetchInterval: 30_000,
    staleTime: 15_000,
    select: (data) => {
      const openCount = data.filter((r) => r.status === "open").length;
      onOpenCountChange?.(openCount);
      return data;
    },
  });

  const handleStatusChange = useCallback(
    (updated: ServiceRequest) => {
      queryClient.setQueryData<ServiceRequest[]>(["service-requests"], (prev) =>
        prev?.map((r) => (r.id === updated.id ? updated : r))
      );
    },
    [queryClient]
  );

  const handleDelete = useCallback(
    (id: number) => {
      queryClient.setQueryData<ServiceRequest[]>(["service-requests"], (prev) =>
        prev?.filter((r) => r.id !== id)
      );
    },
    [queryClient]
  );

  const toggleGroup = (type: ServiceRequestType) => {
    setExpandedGroup((prev) => (prev === type ? null : type));
  };

  const allRequests = requests ?? [];
  const totalOpen = allRequests.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-zinc-700">Hizmet Talepleri</h2>
          {totalOpen > 0 && (
            <span className="text-[11px] font-bold text-white bg-red-400 rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center leading-none">
              {totalOpen}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-xl text-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-all active:scale-95"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {GROUPS.map((group) => {
            const groupRequests = allRequests
              .filter((r) => r.requestType === group.type)
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );

            return (
              <GroupStackCard
                key={group.type}
                group={group}
                requests={groupRequests}
                isExpanded={expandedGroup === group.type}
                onToggle={() => toggleGroup(group.type)}
                presenceMap={presenceMap}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
