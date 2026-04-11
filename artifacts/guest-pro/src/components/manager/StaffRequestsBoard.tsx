import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listServiceRequests,
  REQUEST_TYPE_LABELS,
  type ServiceRequest,
  type ServiceRequestType,
} from "@/lib/service-requests";
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
}

// ─── Group config ─────────────────────────────────────────────────────────────

interface GroupConfig {
  type: ServiceRequestType;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentIconBg: string;
  stackBg: string;
}

const GROUPS: GroupConfig[] = [
  {
    type: "FOOD_ORDER",
    label: "Yemek Siparişleri",
    shortLabel: "Yemek",
    icon: UtensilsCrossed,
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-700",
    accentIconBg: "bg-amber-100",
    stackBg: "bg-amber-50/60",
  },
  {
    type: "SUPPORT_REQUEST",
    label: "Destek Talepleri",
    shortLabel: "Destek",
    icon: Bell,
    accentBg: "bg-sky-50",
    accentBorder: "border-sky-200",
    accentText: "text-sky-700",
    accentIconBg: "bg-sky-100",
    stackBg: "bg-sky-50/60",
  },
  {
    type: "CARE_PROFILE_UPDATE",
    label: "Care About Me",
    shortLabel: "Care",
    icon: Heart,
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentText: "text-rose-600",
    accentIconBg: "bg-rose-100",
    stackBg: "bg-rose-50/60",
  },
  {
    type: "GENERAL_SERVICE_REQUEST",
    label: "Genel Talepler",
    shortLabel: "Genel",
    icon: LayoutGrid,
    accentBg: "bg-zinc-50",
    accentBorder: "border-zinc-200",
    accentText: "text-zinc-600",
    accentIconBg: "bg-zinc-100",
    stackBg: "bg-zinc-50/60",
  },
];

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Tamamlandı",
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

// ─── Stack Card Group ─────────────────────────────────────────────────────────

function GroupStackCard({
  group,
  requests,
  isExpanded,
  onToggle,
  presenceMap,
  onStatusChange,
}: {
  group: GroupConfig;
  requests: ServiceRequest[];
  isExpanded: boolean;
  onToggle: () => void;
  presenceMap: Map<number, TrackingStatus>;
  onStatusChange: (updated: ServiceRequest) => void;
}) {
  const IconComp = group.icon;
  const openCount = requests.filter((r) => r.status === "open").length;
  const total = requests.length;
  const newest = requests[0];

  const stackLayers = Math.min(total, 3);

  return (
    <div className="space-y-2">
      {/* Card stack */}
      <div className="relative" style={{ paddingBottom: stackLayers >= 2 ? 8 : 0 }}>
        {/* Layer 3 (furthest back) */}
        {stackLayers >= 3 && (
          <div
            className={`absolute inset-x-5 bottom-0 rounded-2xl border ${group.accentBorder} ${group.stackBg}`}
            style={{ height: "calc(100% - 4px)", zIndex: 0 }}
          />
        )}
        {/* Layer 2 */}
        {stackLayers >= 2 && (
          <div
            className={`absolute inset-x-2.5 bottom-2 rounded-2xl border ${group.accentBorder} ${group.stackBg}`}
            style={{ height: "calc(100% - 2px)", zIndex: 1 }}
          />
        )}

        {/* Main card */}
        <button
          onClick={onToggle}
          className={`relative w-full text-left rounded-2xl border-2 transition-all active:scale-[0.99] touch-manipulation ${
            isExpanded
              ? `${group.accentBg} ${group.accentBorder} shadow-md`
              : `bg-white ${group.accentBorder} shadow-sm hover:shadow-md`
          }`}
          style={{ zIndex: 2 }}
        >
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${group.accentIconBg} flex items-center justify-center shrink-0`}
              >
                <IconComp className={`w-5 h-5 ${group.accentText}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[15px] font-bold text-zinc-900">{group.label}</p>
                  {openCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${group.accentBg} ${group.accentText} border ${group.accentBorder}`}
                    >
                      {openCount} açık
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-zinc-400">
                  {total === 0
                    ? "Talep yok"
                    : newest
                    ? newest.summary.length > 50
                      ? newest.summary.slice(0, 50) + "…"
                      : newest.summary
                    : `${total} talep`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {total > 0 && (
                  <span className="text-[13px] font-semibold text-zinc-400">{total}</span>
                )}
                {isExpanded ? (
                  <ChevronUp className={`w-4 h-4 ${group.accentText}`} />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </div>

            {/* Status mini-bar */}
            {total > 0 && (
              <div className="flex items-center gap-1.5 mt-3.5">
                {(["open", "in_progress", "resolved"] as const).map((s) => {
                  const count = requests.filter((r) => r.status === s).length;
                  if (count === 0) return null;
                  const colors: Record<string, string> = {
                    open: "bg-red-500",
                    in_progress: "bg-amber-400",
                    resolved: "bg-emerald-500",
                  };
                  return (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors[s]}`} />
                      <span className="text-[11px] text-zinc-400">
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
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {requests.map((request) => (
            <ServiceRequestCard
              key={request.id}
              request={request}
              onStatusChange={onStatusChange}
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

export function StaffRequestsBoard({ presenceMap }: StaffRequestsBoardProps) {
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
  });

  const handleStatusChange = useCallback(
    (updated: ServiceRequest) => {
      queryClient.setQueryData<ServiceRequest[]>(["service-requests"], (prev) =>
        prev?.map((r) => (r.id === updated.id ? updated : r))
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
          <h2 className="text-[14px] font-semibold text-zinc-800">Hizmet Talepleri</h2>
          {totalOpen > 0 && (
            <span className="text-[11px] font-semibold text-white bg-red-500 rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center leading-none">
              {totalOpen}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-2xl h-24 animate-pulse" />
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
