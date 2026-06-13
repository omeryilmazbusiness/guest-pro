import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listServiceRequests,
  deleteServiceRequest,
  type ServiceRequest,
  type ServiceRequestType,
} from "@/lib/service-requests";
import { ServiceRequestCard } from "./ServiceRequestCard";
import {
  RefreshCw,
  Inbox,
  UtensilsCrossed,
  Hammer,
  Heart,
  LayoutGrid,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { TrackingStatus } from "@/lib/tracking";
import { isGuestFeedbackRequest } from "@/lib/guest-feedback";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffRequestsBoardProps {
  presenceMap: Map<number, TrackingStatus>;
}

interface GroupConfig {
  type: ServiceRequestType;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  iconClassName: string;
}

const GROUPS: GroupConfig[] = [
  {
    type: "FOOD_ORDER",
    label: "Yemek siparişleri",
    shortLabel: "Yemek",
    icon: UtensilsCrossed,
    iconClassName: "text-amber-600",
  },
  {
    type: "SUPPORT_REQUEST",
    label: "Destek talepleri",
    shortLabel: "Destek",
    icon: Hammer,
    iconClassName: "text-zinc-600",
  },
  {
    type: "CARE_PROFILE_UPDATE",
    label: "Care About Me",
    shortLabel: "Care",
    icon: Heart,
    iconClassName: "text-rose-500",
  },
  {
    type: "GENERAL_SERVICE_REQUEST",
    label: "Genel talepler",
    shortLabel: "Genel",
    icon: LayoutGrid,
    iconClassName: "text-sky-600",
  },
];

const ACCORDION_CARD =
  "overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150";

function presenceStatus(
  guestId: number,
  presenceMap: Map<number, TrackingStatus>,
): "in_hotel" | "out_of_hotel" | "unknown" | undefined {
  const p = presenceMap.get(guestId);
  if (p === "IN_HOTEL_AND_ON_WIFI" || p === "IN_HOTEL_NOT_ON_WIFI") return "in_hotel";
  if (p === "OUTSIDE_HOTEL") return "out_of_hotel";
  if (p === "UNKNOWN") return "unknown";
  return undefined;
}

function CategoryIcon({ group }: { group: GroupConfig }) {
  const Icon = group.icon;
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
      <Icon className={cn("guest-chat-entry-icon h-8 w-8", group.iconClassName)} strokeWidth={1.5} />
    </span>
  );
}

function RequestCategoryAccordion({
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
  const openCount = requests.filter((r) => r.status === "open").length;
  const total = requests.length;

  return (
    <div className={cn(ACCORDION_CARD, isExpanded && "border-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left touch-manipulation transition-colors hover:bg-zinc-50/80 active:scale-[0.995]"
      >
        <CategoryIcon group={group} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{group.shortLabel}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {total === 0 ? "Talep yok" : `${total} talep`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {openCount > 0 && (
            <span className="min-w-[1.25rem] rounded-md bg-zinc-900 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-white">
              {openCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-100 px-3.5 pb-3.5 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <Inbox className="h-5 w-5 text-zinc-200" strokeWidth={1.5} />
              <p className="text-[11px] text-zinc-400">Bu kategoride talep yok</p>
            </div>
          ) : (
            <div className="space-y-2">
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
        </div>
      )}
    </div>
  );
}

export function StaffRequestsBoard({ presenceMap }: StaffRequestsBoardProps) {
  const queryClient = useQueryClient();
  const [expandedGroup, setExpandedGroup] = useState<ServiceRequestType | null>(null);

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
        prev?.map((r) => (r.id === updated.id ? updated : r)),
      );
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    (id: number) => {
      queryClient.setQueryData<ServiceRequest[]>(["service-requests"], (prev) =>
        prev?.filter((r) => r.id !== id),
      );
    },
    [queryClient],
  );

  const toggleGroup = (type: ServiceRequestType) => {
    setExpandedGroup((prev) => (prev === type ? null : type));
  };

  const allRequests = (requests ?? []).filter((r) => !isGuestFeedbackRequest(r));
  const totalOpen = allRequests.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Talepler
          </h2>
          {totalOpen > 0 && (
            <span className="min-w-[1.125rem] rounded-md bg-zinc-900 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-white">
              {totalOpen}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 disabled:opacity-40"
          aria-label="Yenile"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} strokeWidth={1.75} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[4.25rem] animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {GROUPS.map((group) => {
            const groupRequests = allRequests
              .filter((r) => r.requestType === group.type)
              .sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );

            return (
              <RequestCategoryAccordion
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
