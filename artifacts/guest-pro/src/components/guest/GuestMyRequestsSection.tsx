import { useState, useMemo } from "react";
import {
  UtensilsCrossed,
  Bell,
  Heart,
  LayoutGrid,
  ChevronDown,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import { GUEST_SECTION_IDS } from "@/lib/guest-dashboard-nav";
import type { GuestTranslations } from "@/lib/i18n";
import { deleteMyServiceRequest, type ServiceRequest } from "@/lib/service-requests";
import { buildDisplaySummary } from "@/lib/request-display";

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, mins)}m`;
}

interface RequestGroupConfig {
  requestType: string;
  label: (t: GuestTranslations) => string;
  icon: React.FC<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  accent: string;
  cardTint: string;
}

const REQUEST_GROUP_CONFIGS: RequestGroupConfig[] = [
  {
    requestType: "FOOD_ORDER",
    label: (t) => t.flowFoodLabel,
    icon: UtensilsCrossed,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-100",
    accent: "bg-amber-400/70",
    cardTint: "bg-gradient-to-br from-white via-white to-amber-50/40",
  },
  {
    requestType: "SUPPORT_REQUEST",
    label: (t) => t.flowSupportLabel,
    icon: Bell,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-100",
    accent: "bg-sky-400/70",
    cardTint: "bg-gradient-to-br from-white via-white to-sky-50/40",
  },
  {
    requestType: "CARE_PROFILE_UPDATE",
    label: (t) => t.flowCareLabel,
    icon: Heart,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50 border-rose-100",
    accent: "bg-rose-400/70",
    cardTint: "bg-gradient-to-br from-white via-white to-rose-50/40",
  },
  {
    requestType: "GENERAL_SERVICE_REQUEST",
    label: (t) => t.myRequestsTitle,
    icon: LayoutGrid,
    iconColor: "text-zinc-600",
    iconBg: "bg-zinc-50 border-zinc-100",
    accent: "bg-zinc-400/70",
    cardTint: "bg-gradient-to-br from-white via-white to-zinc-50/80",
  },
];

const STATUS_CONFIG: Record<
  string,
  { label: (t: GuestTranslations) => string; text: string; dot: string }
> = {
  open: { label: (t) => t.reqStatusOpen, text: "text-amber-600", dot: "bg-amber-400" },
  in_progress: { label: (t) => t.reqStatusInProgress, text: "text-sky-600", dot: "bg-sky-500" },
  resolved: { label: (t) => t.reqStatusResolved, text: "text-emerald-600", dot: "bg-emerald-400" },
};

function RequestCard({
  request,
  t,
  onDelete,
}: {
  request: ServiceRequest;
  t: GuestTranslations;
  onDelete?: (id: number) => void;
}) {
  const gc =
    REQUEST_GROUP_CONFIGS.find((c) => c.requestType === request.requestType) ??
    REQUEST_GROUP_CONFIGS[3];
  const sc = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.open;
  const Icon = gc.icon;
  const displayText = buildDisplaySummary(request);

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
    <div className="mx-2.5 mb-1.5 last:mb-2.5 rounded-xl bg-zinc-50/90 border border-zinc-100 px-2.5 py-2 flex items-center gap-2.5">
      <span className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", gc.iconBg)}>
        <Icon className={cn("w-4 h-4", gc.iconColor)} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-zinc-900 leading-snug truncate">{displayText}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sc.dot)} />
          <p className={cn("text-[11px] font-semibold", sc.text)}>{sc.label(t)}</p>
          <span className="text-[11px] text-zinc-300">·</span>
          <p className="text-[11px] text-zinc-400">{timeAgo(request.createdAt)}</p>
        </div>
      </div>

      {request.status === "resolved" && onDelete && (
        <div className="shrink-0">
          {deleteState === "idle" && (
            <button
              type="button"
              onClick={() => setDeleteState("confirming")}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-white transition-all"
              aria-label={t.reqDeleteLabel}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {deleteState === "confirming" && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleDelete}
                className="text-[11px] font-semibold text-red-500 hover:text-red-600 px-1.5 py-0.5 rounded-md hover:bg-red-50 transition-all"
              >
                {t.reqDeleteConfirm}
              </button>
              <button
                type="button"
                onClick={() => setDeleteState("idle")}
                className="text-[11px] text-zinc-300 hover:text-zinc-500 px-1 transition-all"
              >
                ✕
              </button>
            </div>
          )}
          {deleteState === "deleting" && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-300 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

function GuestRequestGroups({
  requests,
  t,
  onDelete,
}: {
  requests: ServiceRequest[];
  t: GuestTranslations;
  onDelete?: (id: number) => void;
}) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<string, ServiceRequest[]> = {};
    for (const req of requests) {
      if (!map[req.requestType]) map[req.requestType] = [];
      map[req.requestType].push(req);
    }
    return map;
  }, [requests]);

  const toggle = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const activeGroups = REQUEST_GROUP_CONFIGS.filter(
    (g) => (grouped[g.requestType]?.length ?? 0) > 0,
  );

  if (activeGroups.length === 0) return null;

  return (
    <div className={cn("flex flex-col", dash.rowGap)}>
      {activeGroups.map((group) => {
        const items = grouped[group.requestType] ?? [];
        const isExpanded = expandedTypes.has(group.requestType);
        const Icon = group.icon;
        const newestSummary = items[0]?.summary ?? "";

        return (
          <article key={group.requestType} className={cn(dash.lightCard, group.cardTint)}>
            <button
              type="button"
              onClick={() => toggle(group.requestType)}
              className="relative w-full text-left"
            >
              <span className="flex items-center gap-2.5 px-3 py-2.5">
                <span
                  className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", group.accent)}
                  aria-hidden
                />
                <span
                  className={cn(
                    "ml-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                    group.iconBg,
                  )}
                >
                  <Icon className={cn("w-4 h-4", group.iconColor)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className={cn(dash.title, "min-w-0")}>{group.label(t)}</p>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-px text-[10px] font-bold leading-none text-zinc-500">
                      {items.length}
                    </span>
                  </span>
                  {!isExpanded && newestSummary && (
                    <p className={cn(dash.subtitle, "mt-1 line-clamp-2")}>{newestSummary}</p>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0",
                    isExpanded && "rotate-180",
                  )}
                />
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-zinc-100/80 pb-1 animate-in slide-in-from-top-1 fade-in duration-150">
                {items.map((req) => (
                  <RequestCard key={req.id} request={req} t={t} onDelete={onDelete} />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

interface GuestMyRequestsSectionProps {
  requests: ServiceRequest[] | undefined;
  t: GuestTranslations;
  onDelete: (id: number) => void;
}

export function GuestMyRequestsSection({ requests, t, onDelete }: GuestMyRequestsSectionProps) {
  if (requests === undefined) return null;

  return (
    <section
      id={GUEST_SECTION_IDS.requests}
      className={cn(dash.section, "scroll-mt-[80px] mt-8 pt-1")}
      aria-label={t.myRequestsTitle}
    >
      <h3 className={cn(dash.sectionTitle, "mb-2.5")}>{t.myRequestsTitle}</h3>
      {requests.length === 0 ? (
        <div className={cn(dash.lightCard, "px-4 py-5 flex flex-col items-center gap-2 text-center")}>
          <span className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-zinc-300" />
          </span>
          <p className="text-[12px] text-zinc-500 leading-relaxed">{t.myRequestsEmpty}</p>
        </div>
      ) : (
        <GuestRequestGroups requests={requests} t={t} onDelete={onDelete} />
      )}
    </section>
  );
}
