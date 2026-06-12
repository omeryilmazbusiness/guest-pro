import { useMemo, useState } from "react";
import {
  Check,
  ChefHat,
  ListChecks,
  Loader2,
  Trash2,
  Truck,
  Hammer,
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
import { GuestPremiumSheet } from "@/components/guest/GuestPremiumSheet";

type RequestTab = "open" | "preparing" | "completed";

const PREVIEW_LIMIT = 2;

const guestFramedDark =
  "overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.08]";

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

function statusTone(status: ServiceRequest["status"]): string {
  if (status === "in_progress") return "text-sky-300";
  if (status === "resolved") return "text-emerald-300/80";
  return "text-zinc-500";
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
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const stepIdx = order.indexOf(step.id);
          const done = stepIdx < currentIdx;
          const active = stepIdx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {i > 0 && (
                <span
                  className={cn(
                    "absolute top-4 h-0.5 -left-1/2 w-full -translate-y-1/2",
                    done ? "bg-emerald-400/80" : "bg-white/10",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-emerald-400/70 bg-emerald-500/10 text-emerald-300",
                  active && "border-sky-400/80 bg-sky-500/10 text-sky-300",
                  !done && !active && "border-white/10 bg-white/[0.03] text-zinc-600",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active && step.id === "kitchen" && "animate-pulse")} />
              </span>
              <p
                className={cn(
                  "mt-1.5 line-clamp-2 text-center text-[9px] font-semibold leading-tight",
                  active ? "text-white" : done ? "text-emerald-300/90" : "text-zinc-600",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      {eta != null && phase !== "delivered" && (
        <p className="mt-2.5 text-center text-[11px] font-medium text-sky-300">
          {tFmt(t.fulfillmentEtaMinutes, { n: String(eta) })}
        </p>
      )}
    </div>
  );
}

function RequestPreviewRow({
  request,
  t,
}: {
  request: ServiceRequest;
  t: GuestTranslations;
}) {
  const { uiLocale } = useLocale();
  const summary = buildDisplaySummary(request, t);

  return (
    <li className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <p className="line-clamp-2 text-[12px] font-medium leading-snug text-white">{summary}</p>
      <p className={cn("mt-0.5 text-[10px]", statusTone(request.status))}>
        {timeAgo(request.createdAt, uiLocale)}
      </p>
    </li>
  );
}

function RequestRow({
  request,
  t,
  showRoadmap,
  onDelete,
  dark = false,
}: {
  request: ServiceRequest;
  t: GuestTranslations;
  showRoadmap?: boolean;
  onDelete?: (id: number) => void;
  dark?: boolean;
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
    <article
      className={cn(
        "rounded-xl px-3.5 py-3",
        dark
          ? "border border-white/[0.08] bg-white/[0.04]"
          : "border border-zinc-100 bg-zinc-50/50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[13px] font-semibold leading-snug",
              dark ? "text-white" : "text-zinc-900",
            )}
          >
            {summary}
          </p>
          <p className={cn("mt-1 text-[11px]", dark ? "text-zinc-500" : "text-zinc-400")}>
            {timeAgo(request.createdAt, uiLocale)}
          </p>
        </div>
        {request.status === "resolved" && onDelete && (
          <div className="shrink-0">
            {deleteState === "idle" && (
              <button
                type="button"
                onClick={() => setDeleteState("confirming")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  dark
                    ? "text-zinc-600 hover:bg-white/10 hover:text-zinc-300"
                    : "text-zinc-300 hover:bg-white hover:text-zinc-500",
                )}
                aria-label={t.reqDeleteLabel}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {deleteState === "confirming" && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-300"
              >
                {t.reqDeleteConfirm}
              </button>
            )}
            {deleteState === "deleting" && (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
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

  const sortedRequests = useMemo(
    () =>
      [...(requests ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [requests],
  );

  const previewRequests = sortedRequests.slice(0, PREVIEW_LIMIT);
  const hasMore = sortedRequests.length > PREVIEW_LIMIT;
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
      <div className={cn(guestFramedDark, "mt-3")}>
        <div className="flex items-center justify-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
          <ListChecks className="h-4 w-4 text-sky-400" strokeWidth={1.75} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t.myRequestsTitle}
          </p>
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "w-full px-3 pb-3 pt-2 text-start",
            "transition-transform duration-200 hover:scale-[1.005] active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
          )}
          aria-label={t.myRequestsTitle}
        >
          {previewRequests.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-zinc-600">{t.myRequestsEmpty}</p>
          ) : (
            <ul className="space-y-1.5">
              {previewRequests.map((req) => (
                <RequestPreviewRow key={req.id} request={req} t={t} />
              ))}
            </ul>
          )}

          {hasMore && (
            <p className="mt-2 text-center text-[13px] font-medium tracking-widest text-zinc-600">
              …
            </p>
          )}

          <p className="mt-2 text-center text-[11px] font-medium text-zinc-500">
            {t.myRequestsTapToView}
          </p>
        </button>
      </div>

      <GuestPremiumSheet
        open={open}
        onOpenChange={setOpen}
        placement="center"
        overlayStyle="liquidGlass"
        showClose
        ariaLabel={t.myRequestsTitle}
        className="gap-0 max-w-[min(100vw-1.5rem,24rem)] border-white/10 bg-zinc-950/92 p-0 backdrop-blur-2xl"
        panelClassName="!bg-zinc-950/92 !border-white/10 backdrop-blur-2xl"
      >
        <div className="border-b border-white/[0.08] px-4 pb-3 pt-4 pe-12 text-start">
          <h2 className="text-base font-semibold text-white">{t.myRequestsTitle}</h2>
          <p className="text-[12px] text-zinc-500">{t.myRequestsSubtitle}</p>
        </div>

        <div className="flex gap-1 px-3 pb-2 pt-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex-1 rounded-xl px-1 py-2 text-center transition-colors",
                tab === item.id
                  ? "bg-white/10 text-white ring-1 ring-white/15"
                  : "text-zinc-500 hover:bg-white/[0.04]",
              )}
            >
              <span className="block text-[10px] font-bold leading-none">{item.count}</span>
              <span className="mt-1 block text-[10px] font-semibold leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="max-h-[min(60vh,22rem)] space-y-2 overflow-y-auto overscroll-contain px-3 pb-4 pt-1">
          {currentList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <ListChecks className="mx-auto h-8 w-8 text-zinc-600" strokeWidth={1.5} />
              <p className="mt-2 text-[12px] text-zinc-500">{t.myRequestsEmpty}</p>
            </div>
          ) : (
            currentList.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                t={t}
                dark
                showRoadmap={tab === "preparing"}
                onDelete={tab === "completed" ? onDelete : undefined}
              />
            ))
          )}
        </div>
      </GuestPremiumSheet>
    </>
  );
}
