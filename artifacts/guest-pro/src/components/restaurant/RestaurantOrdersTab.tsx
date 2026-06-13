/**
 * RestaurantOrdersTab — food orders with iconic collapsible status groups.
 */
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RefreshCw,
  Inbox,
  ChevronDown,
  DoorOpen,
  Clock,
  ChefHat,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  listOrders,
  updateOrderStatus,
  type FoodOrder,
  type OrderStatus,
} from "@/lib/restaurant";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff, type StaffTranslations } from "@/lib/staff-i18n";
import { cn } from "@/lib/utils";

const ACCORDION_CARD =
  "overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150";

const ITEM_CARD =
  "rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]";

const STATUS_GROUPS: {
  status: OrderStatus;
  icon: LucideIcon;
  iconClassName: string;
}[] = [
  { status: "open", icon: Clock, iconClassName: "text-rose-500" },
  { status: "in_progress", icon: ChefHat, iconClassName: "text-amber-600" },
  { status: "resolved", icon: CheckCircle2, iconClassName: "text-emerald-600" },
];

const STATUS_META: Record<
  OrderStatus,
  { dot: string; labelKey: keyof StaffTranslations; actionKey?: keyof StaffTranslations }
> = {
  open: { dot: "bg-rose-400", labelKey: "orderStatusOpen", actionKey: "advanceToInProgress" },
  in_progress: { dot: "bg-amber-400", labelKey: "orderStatusInProgress", actionKey: "advanceToResolved" },
  resolved: { dot: "bg-emerald-400", labelKey: "orderStatusResolved" },
};

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: null,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function GuestInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[11px] font-semibold tracking-wide text-white"
      aria-hidden
    >
      <span className="font-serif leading-none">{initials}</span>
    </div>
  );
}

function OrderItemCard({
  order,
  onStatusChange,
  t,
}: {
  order: FoodOrder;
  onStatusChange: (updated: FoodOrder) => void;
  t: StaffTranslations;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const meta = STATUS_META[status];
  const nextStatus = STATUS_NEXT[status];
  const actionLabel = meta.actionKey ? t[meta.actionKey] : null;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setStatus(nextStatus);
      onStatusChange(updated);
      if (actionLabel) {
        toast.success(tStaff(t.orderMarked, { label: actionLabel }));
      }
    } catch {
      toast.error(t.orderUpdateFailed);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className={ITEM_CARD}>
      <div className="flex items-start gap-2.5">
        <GuestInitials firstName={order.guestFirstName} lastName={order.guestLastName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold text-zinc-900">
              {order.guestFirstName} {order.guestLastName}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-zinc-600">
              <DoorOpen className="h-3 w-3 text-zinc-400" strokeWidth={1.75} />
              {order.roomNumber}
            </span>
          </div>

          <p className="mt-1 text-[12px] leading-snug text-zinc-600">{order.summary}</p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
              <span>{t[meta.labelKey]}</span>
              <span className="text-zinc-300">·</span>
              <span>{formatRelativeTime(order.createdAt)}</span>
            </div>

            {actionLabel && (
              <button
                type="button"
                onClick={handleAdvance}
                disabled={isUpdating}
                className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
              >
                {isUpdating ? "…" : actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function OrderStatusAccordion({
  status,
  orders,
  isExpanded,
  onToggle,
  onStatusChange,
  t,
}: {
  status: OrderStatus;
  orders: FoodOrder[];
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (updated: FoodOrder) => void;
  t: StaffTranslations;
}) {
  const group = STATUS_GROUPS.find((g) => g.status === status)!;
  const Icon = group.icon;
  const label = t[STATUS_META[status].labelKey];
  const openCount = status === "open" ? orders.length : 0;

  return (
    <div className={cn(ACCORDION_CARD, isExpanded && "border-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left touch-manipulation transition-colors hover:bg-zinc-50/80 active:scale-[0.995]"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
          <Icon
            className={cn("guest-chat-entry-icon h-8 w-8", group.iconClassName)}
            strokeWidth={1.5}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{label}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {orders.length === 0 ? t.noOrders : `${orders.length}`}
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
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <Inbox className="h-5 w-5 text-zinc-200" strokeWidth={1.5} />
              <p className="text-[11px] text-zinc-400">{t.noOrders}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <OrderItemCard
                  key={order.id}
                  order={order}
                  onStatusChange={onStatusChange}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RestaurantOrdersTab() {
  const queryClient = useQueryClient();
  const { t } = useStaffLocale();
  const [expandedStatus, setExpandedStatus] = useState<OrderStatus | null>(null);

  const { data: orders, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["restaurant-orders"],
    queryFn: () => listOrders(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const handleStatusChange = useCallback(
    (updated: FoodOrder) => {
      queryClient.setQueryData<FoodOrder[]>(["restaurant-orders"], (prev) =>
        prev?.map((o) => (o.id === updated.id ? updated : o)),
      );
    },
    [queryClient],
  );

  const all = orders ?? [];
  const byStatus: Record<OrderStatus, FoodOrder[]> = {
    open: all.filter((o) => o.status === "open"),
    in_progress: all.filter((o) => o.status === "in_progress"),
    resolved: all.filter((o) => o.status === "resolved"),
  };
  const activeCount = byStatus.open.length + byStatus.in_progress.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t.ordersTitle}
          </h2>
          {activeCount > 0 && (
            <span className="min-w-[1.125rem] rounded-md bg-zinc-900 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-white">
              {activeCount}
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[4.25rem] animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {STATUS_GROUPS.map(({ status }) => (
            <OrderStatusAccordion
              key={status}
              status={status}
              orders={byStatus[status]}
              isExpanded={expandedStatus === status}
              onToggle={() =>
                setExpandedStatus((prev) => (prev === status ? null : status))
              }
              onStatusChange={handleStatusChange}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
