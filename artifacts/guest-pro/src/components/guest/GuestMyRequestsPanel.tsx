import { useMemo, useState } from "react";
import {
  Check,
  ChefHat,
  ChevronRight,
  Hammer,
  Loader2,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GuestTranslations } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { tFmt } from "@/lib/i18n";
import {
  deleteMyServiceRequest,
  type ServiceRequest,
} from "@/lib/service-requests";
import { buildDisplaySummary } from "@/lib/request-display";
import {
  estimateEtaMinutes,
  isFoodOrder,
  resolveFulfillmentPhase,
  type FulfillmentPhase,
} from "@/lib/guest-request-fulfillment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RequestTab = "open" | "preparing" | "completed";

function timeAgo(isoString: string, locale: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  return rtf.format(-Math.max(1, mins), "minute");
}

function FulfillmentRoadmap({
  request,
  t,
}: {
  request: ServiceRequest;
  t: GuestTranslations;
}) {
  const phase = resolveFulfillmentPhase(request);
  const eta = estimateEtaMinutes(request, phase);
  const food = isFoodOrder(request);

  const steps: { id: FulfillmentPhase; label: string; icon: React.FC<{ className?: string }> }[] =
    food
      ? [
          { id: "received", label: t.fulfillmentStepReceived, icon: Hammer },
          { id: "kitchen", label: t.fulfillmentStepKitchen, icon: ChefHat },
          { id: "en_route", label: t.fulfillmentStepEnRoute, icon: Truck },
          { id: "delivered", label: t.fulfillmentStepDone, icon: Check },
        ]
      : [
          { id: "received", label: t.fulfillmentStepReceived, icon: Hammer },
          { id: "kitchen", label: t.reqStatusInProgress, icon: Loader2 },
          { id: "delivered", label: t.fulfillmentStepDone, icon: Check },
        ];

  const order: FulfillmentPhase[] = food
    ? ["received", "kitchen", "en_route", "delivered"]
    : ["received", "kitchen", "delivered"];

  const currentIdx = order.indexOf(phase);

  return (
    <div className="mt-3 rounded-2xl bg-zinc-50/90 border border-zinc-100 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const stepIdx = order.indexOf(step.id);
          const done = stepIdx < currentIdx;
          const active = stepIdx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex flex-1 flex-col items-center min-w-0 relative">
              {i > 0 && (
                <span
                  className={cn(
                    "absolute top-4 h-0.5 -left-1/2 w-full -translate-y-1/2",
                    done ? "bg-emerald-400" : "bg-zinc-200",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-emerald-400 bg-emerald-50 text-emerald-600",
                  active && "border-sky-500 bg-sky-50 text-sky-600 shadow-sm shadow-sky-500/20",
                  !done && !active && "border-zinc-200 bg-white text-zinc-300",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active && step.id === "kitchen" && "animate-pulse")} />
              </span>
              <p
                className={cn(
                  "mt-1.5 text-[9px] font-semibold text-center leading-tight line-clamp-2",
                  active ? "text-zinc-800" : done ? "text-emerald-700" : "text-zinc-400",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      {eta != null && phase !== "delivered" && (
        <p className="mt-2.5 text-center text-[11px] font-medium text-sky-600">
          {tFmt(t.fulfillmentEtaMinutes, { n: String(eta) })}
        </p>
      )}
    </div>
  );
}

function RequestRow({
  request,
  t,
  showRoadmap,
  onDelete,
}: {
  request: ServiceRequest;
  t: GuestTranslations;
  showRoadmap?: boolean;
  onDelete?: (id: number) => void;
}) {
  const { uiLocale } = useLocale();
  const summary = buildDisplaySummary(request, t);
  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "deleting">("idle");

  const handleDelete = async () => {
    setDeleteState("deleting");
    try {
      await deleteMyServiceRequest(request.id);
      onDelete?.(request.id);
      toast.success(t.reqDeletedToast);
    } catch {
      toast.error(t.sendFailed);
      setDeleteState("idle");
    }
  };

  return (
    <article className="rounded-2xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-zinc-900 leading-snug">{summary}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{timeAgo(request.createdAt, uiLocale)}</p>
        </div>
        {request.status === "resolved" && onDelete && (
          <div className="shrink-0">
            {deleteState === "idle" && (
              <button
                type="button"
                onClick={() => setDeleteState("confirming")}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500"
                aria-label={t.reqDeleteLabel}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {deleteState === "confirming" && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600"
              >
                {t.reqDeleteConfirm}
              </button>
            )}
            {deleteState === "deleting" && (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
            )}
          </div>
        )}
      </div>
      {showRoadmap && request.status === "in_progress" && (
        <FulfillmentRoadmap request={request} t={t} />
      )}
    </article>
  );
}

interface GuestMyRequestsPanelProps {
  requests: ServiceRequest[] | undefined;
  t: GuestTranslations;
  onDelete: (id: number) => void;
}

export function GuestMyRequestsPanel({ requests, t, onDelete }: GuestMyRequestsPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RequestTab>("preparing");

  const grouped = useMemo(() => {
    const list = requests ?? [];
    return {
      open: list.filter((r) => r.status === "open"),
      preparing: list.filter((r) => r.status === "in_progress"),
      completed: list.filter((r) => r.status === "resolved"),
    };
  }, [requests]);

  const activeCount = grouped.open.length + grouped.preparing.length;

  if (requests === undefined) return null;

  const tabs: { id: RequestTab; label: string; count: number }[] = [
    { id: "open", label: t.myRequestsTabOpen, count: grouped.open.length },
    { id: "preparing", label: t.myRequestsTabPreparing, count: grouped.preparing.length },
    { id: "completed", label: t.myRequestsTabCompleted, count: grouped.completed.length },
  ];

  const currentList = grouped[tab];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-2.5 w-full flex items-center gap-2.5 rounded-2xl border px-3 py-2.5",
          "bg-white/80 border-zinc-100 shadow-sm",
          "transition-all hover:border-zinc-200 hover:shadow-md active:scale-[0.99]",
        )}
        aria-label={t.myRequestsTitle}
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Hammer className="h-4 w-4" strokeWidth={1.85} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          )}
        </span>
        <span className="flex-1 min-w-0 text-start">
          <p className="text-[13px] font-semibold text-zinc-900 leading-none">{t.myRequestsTitle}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500 truncate">
            {activeCount > 0
              ? tFmt(t.myRequestsActiveHint, { n: String(activeCount) })
              : t.myRequestsTapToView}
          </p>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(100vw-1.5rem,24rem)] rounded-[1.35rem] border-zinc-100 p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-zinc-100 text-start">
            <DialogTitle className="text-base font-semibold text-zinc-900">
              {t.myRequestsTitle}
            </DialogTitle>
            <p className="text-[12px] text-zinc-500 font-normal">{t.myRequestsSubtitle}</p>
          </DialogHeader>

          <div className="flex gap-1 px-3 pt-3 pb-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex-1 rounded-xl py-2 px-1 text-center transition-colors",
                  tab === item.id
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100",
                )}
              >
                <span className="block text-[10px] font-bold leading-none">{item.count}</span>
                <span className="mt-1 block text-[10px] font-semibold leading-tight">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain px-3 pb-4 pt-1 space-y-2">
            {currentList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center">
                <p className="text-[12px] text-zinc-500">{t.myRequestsEmpty}</p>
              </div>
            ) : (
              currentList.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  t={t}
                  showRoadmap={tab === "preparing"}
                  onDelete={tab === "completed" ? onDelete : undefined}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
