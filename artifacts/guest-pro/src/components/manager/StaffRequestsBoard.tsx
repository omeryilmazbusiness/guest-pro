import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listServiceRequests,
  updateServiceRequestStatus,
  REQUEST_TYPE_LABELS,
  type ServiceRequest,
  type ServiceRequestType,
  type ServiceRequestStatus,
} from "@/lib/service-requests";
import { ServiceRequestCard } from "./ServiceRequestCard";
import { Bell, RefreshCw, Inbox } from "lucide-react";
import type { TrackingStatus } from "@/lib/tracking";

export interface StaffRequestsBoardProps {
  presenceMap: Map<number, TrackingStatus>;
}

type TabFilter = "all" | ServiceRequestType;

const TABS: { key: TabFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "SUPPORT_REQUEST", label: "Destek" },
  { key: "FOOD_ORDER", label: "Yemek" },
  { key: "CARE_PROFILE_UPDATE", label: "Care" },
  { key: "GENERAL_SERVICE_REQUEST", label: "Genel" },
];

export function StaffRequestsBoard({ presenceMap }: StaffRequestsBoardProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | "all">("all");

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

  const filtered = (requests ?? []).filter((r) => {
    if (activeTab !== "all" && r.requestType !== activeTab) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const openCount = (requests ?? []).filter((r) => r.status === "open").length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-zinc-800">Hizmet Talepleri</h2>
          {openCount > 0 && (
            <span className="text-[11px] font-semibold text-white bg-red-500 rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center leading-none">
              {openCount}
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

      {/* Type tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {(["all", "open", "in_progress", "resolved"] as const).map((s) => {
          const labels = { all: "Tümü", open: "Açık", in_progress: "İşlemde", resolved: "Tamamlandı" };
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                statusFilter === s
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-zinc-300" />
          </div>
          <p className="text-[13px] text-zinc-400">Talep bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => {
            const presence = presenceMap.get(request.guestId);
            const presenceStatus: "in_hotel" | "out_of_hotel" | "unknown" | undefined =
              presence === "IN_HOTEL_AND_ON_WIFI" || presence === "IN_HOTEL_NOT_ON_WIFI"
                ? "in_hotel"
                : presence === "OUTSIDE_HOTEL"
                ? "out_of_hotel"
                : presence === "UNKNOWN"
                ? "unknown"
                : undefined;

            return (
              <ServiceRequestCard
                key={request.id}
                request={request}
                onStatusChange={handleStatusChange}
                presenceStatus={presenceStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
