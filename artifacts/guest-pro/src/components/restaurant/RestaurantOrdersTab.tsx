/**
 * RestaurantOrdersTab
 * Displays FOOD_ORDER service requests with status management.
 * Auto-refreshes every 30s — mirrors StaffRequestsBoard pattern.
 */
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RefreshCw,
  Inbox,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  MapPin,
  User,
} from "lucide-react";
import {
  listOrders,
  updateOrderStatus,
  type FoodOrder,
  type OrderStatus,
} from "@/lib/restaurant";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; dotClass: string; badgeBg: string; badgeText: string; next: OrderStatus | null; nextLabel: string }
> = {
  open:        { label: "Açık",       dotClass: "bg-red-400",     badgeBg: "bg-red-50",     badgeText: "text-red-600",     next: "in_progress", nextLabel: "İşleme Al" },
  in_progress: { label: "Hazırlanıyor", dotClass: "bg-amber-400", badgeBg: "bg-amber-50",   badgeText: "text-amber-700",   next: "resolved",    nextLabel: "Teslim Edildi" },
  resolved:    { label: "Tamamlandı", dotClass: "bg-emerald-400", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700", next: null,          nextLabel: "" },
};

// ── Single order card ─────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
}: {
  order: FoodOrder;
  onStatusChange: (updated: FoodOrder) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const config = STATUS_CONFIG[order.status];
  const time = new Date(order.createdAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAdvance = async () => {
    if (!config.next) return;
    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, config.next);
      onStatusChange(updated);
      toast.success(config.nextLabel + " olarak işaretlendi");
    } catch {
      toast.error("Durum güncellenemedi");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} />
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}>
            {config.label}
          </span>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono shrink-0">{time}</span>
      </div>

      {/* Guest info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          {order.guestFirstName} {order.guestLastName}
        </div>
        <div className="flex items-center gap-1 text-[12px] text-zinc-500">
          <MapPin className="w-3 h-3" />
          Oda {order.roomNumber}
        </div>
      </div>

      {/* Order summary */}
      <p className="text-[13px] text-zinc-600 leading-relaxed bg-zinc-50 rounded-xl px-3 py-2.5">
        {order.summary}
      </p>

      {/* Action button */}
      {config.next && (
        <button
          onClick={handleAdvance}
          disabled={isUpdating}
          className={`w-full h-9 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98] touch-manipulation
            ${order.status === "open"
              ? "bg-zinc-900 text-white hover:bg-zinc-800"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
            } disabled:opacity-60`}
        >
          {isUpdating ? "…" : config.nextLabel}
        </button>
      )}
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────────────

function OrderGroup({
  status,
  orders,
  defaultExpanded,
  onStatusChange,
}: {
  status: OrderStatus;
  orders: FoodOrder[];
  defaultExpanded: boolean;
  onStatusChange: (updated: FoodOrder) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = STATUS_CONFIG[status];

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between bg-white rounded-2xl border border-zinc-100 px-4 py-3 shadow-sm hover:border-zinc-200 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dotClass}`} />
          <span className="text-[13px] font-semibold text-zinc-700">{config.label}</span>
          <span className="text-[11px] font-mono text-zinc-400">({orders.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-300" />}
      </button>

      {expanded && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-8 bg-white rounded-2xl border border-zinc-100 gap-2">
              <Inbox className="w-5 h-5 text-zinc-200" />
              <p className="text-[12px] text-zinc-400">Sipariş yok</p>
            </div>
          ) : (
            orders.map((o) => (
              <OrderCard key={o.id} order={o} onStatusChange={onStatusChange} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RestaurantOrdersTab() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["restaurant-orders"],
    queryFn: () => listOrders(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const handleStatusChange = useCallback(
    (updated: FoodOrder) => {
      queryClient.setQueryData<FoodOrder[]>(["restaurant-orders"], (prev) =>
        prev?.map((o) => (o.id === updated.id ? updated : o))
      );
    },
    [queryClient]
  );

  const all = orders ?? [];
  const openOrders = all.filter((o) => o.status === "open");
  const inProgress = all.filter((o) => o.status === "in_progress");
  const resolved = all.filter((o) => o.status === "resolved");

  const openCount = openOrders.length + inProgress.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          <h2 className="text-[14px] font-semibold text-zinc-700">Yemek Siparişleri</h2>
          {openCount > 0 && (
            <span className="text-[11px] font-bold text-white bg-red-400 rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center leading-none">
              {openCount}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-xl text-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <OrderGroup status="open"        orders={openOrders} defaultExpanded={true}  onStatusChange={handleStatusChange} />
          <OrderGroup status="in_progress" orders={inProgress} defaultExpanded={true}  onStatusChange={handleStatusChange} />
          <OrderGroup status="resolved"    orders={resolved}   defaultExpanded={false} onStatusChange={handleStatusChange} />
        </div>
      )}
    </div>
  );
}
