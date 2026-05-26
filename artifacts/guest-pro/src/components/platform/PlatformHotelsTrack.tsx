import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  UserCircle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countryFlag } from "@/lib/locale";
import {
  HOTEL_PLAN_TIERS,
  PLAN_LABELS,
  daysUntilRenewal,
  formatPlatformDate,
  formatPlatformDateTime,
  type HotelPlanTier,
} from "@/lib/platform-plans";
import { updatePlatformHotel, type PlatformHotelTrack } from "@/lib/platform-api";
import { absoluteAppHref, hotelLoginPath } from "@/lib/tenant-path";
import { cn } from "@/lib/utils";

function RenewalBadge({ renewsAt }: { renewsAt: string | null }) {
  const days = daysUntilRenewal(renewsAt);
  if (days === null) {
    return <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">No renewal date</span>;
  }
  if (days < 0) {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Overdue {Math.abs(days)}d
      </span>
    );
  }
  if (days <= 14) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
        Renews in {days}d
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      Renews in {days}d
    </span>
  );
}

function TrackCard({
  property,
  onManage,
}: {
  property: PlatformHotelTrack;
  onManage?: (p: PlatformHotelTrack) => void;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [planTier, setPlanTier] = useState<HotelPlanTier>(property.planTier ?? "starter");
  const [renewsAt, setRenewsAt] = useState(
    property.subscriptionRenewsAt?.slice(0, 10) ?? "",
  );
  const [notes, setNotes] = useState(property.platformNotes ?? "");

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePlatformHotel(property.id, {
        planTier,
        subscriptionRenewsAt: renewsAt ? renewsAt : null,
        platformNotes: notes.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Tracking updated");
      await queryClient.invalidateQueries({ queryKey: ["platform-track"] });
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tier = property.planTier ?? "starter";

  return (
    <article className="rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-medium text-zinc-900">{property.name}</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  property.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
                )}
              >
                {property.isActive ? "Live" : "Paused"}
              </span>
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
                {PLAN_LABELS[tier] ?? tier}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-zinc-400">/{property.slug}</p>
          </div>
          <RenewalBadge renewsAt={property.subscriptionRenewsAt} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-zinc-400">Registered</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">{formatPlatformDate(property.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Last updated</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">{formatPlatformDate(property.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Renewal</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {formatPlatformDate(property.subscriptionRenewsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Last activity</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {formatPlatformDateTime(property.lastActivityAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <UserCircle className="h-3.5 w-3.5 text-zinc-400" />
            {property.managerCount} GM
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            {property.staffCount} staff
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            {property.activeGuestCount} active guests
          </span>
        </div>

        {property.generalManager && (
          <p className="mt-2 truncate text-xs text-zinc-500">
            GM: <span className="font-medium text-zinc-700">{property.generalManager.email}</span>
          </p>
        )}

        {(property.address || property.countryCode) && (
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
            {property.countryCode ? `${countryFlag(property.countryCode)} ` : ""}
            {property.address ?? ""}
          </p>
        )}

        {property.platformNotes && !expanded && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-500 italic">{property.platformNotes}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-50 px-4 py-2">
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide" : "Edit"} plan & notes
        </button>
        <div className="flex gap-2">
          {onManage && (
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => onManage(property)}>
              Manage
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs" asChild>
            <a href={absoluteAppHref(hotelLoginPath(property.slug))} target="_blank" rel="noreferrer">
              Login
            </a>
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Package</Label>
              <select
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value as HotelPlanTier)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              >
                {HOTEL_PLAN_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {PLAN_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Renewal date
              </Label>
              <input
                type="date"
                value={renewsAt}
                onChange={(e) => setRenewsAt(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Internal notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Billing, contract, onboarding notes…"
              className="min-h-[72px] resize-none rounded-xl bg-white text-sm"
            />
          </div>
          <Button
            type="button"
            className="h-9 rounded-xl"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save tracking"}
          </Button>
        </div>
      )}
    </article>
  );
}

export function PlatformHotelsTrack({
  properties,
  loading,
  onManage,
}: {
  properties: PlatformHotelTrack[];
  loading?: boolean;
  onManage?: (p: PlatformHotelTrack) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-14">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center">
        <Building2 className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm text-zinc-500">No properties to track yet.</p>
      </div>
    );
  }

  const live = properties.filter((p) => p.isActive).length;
  const overdue = properties.filter((p) => {
    const d = daysUntilRenewal(p.subscriptionRenewsAt);
    return d !== null && d < 0;
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="text-lg font-semibold tabular-nums text-zinc-900">{properties.length}</p>
          <p className="text-[10px] text-zinc-500">Properties</p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="text-lg font-semibold tabular-nums text-emerald-700">{live}</p>
          <p className="text-[10px] text-zinc-500">Live</p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm ring-1 ring-zinc-100">
          <p className={cn("text-lg font-semibold tabular-nums", overdue > 0 ? "text-red-600" : "text-zinc-900")}>
            {overdue}
          </p>
          <p className="text-[10px] text-zinc-500">Overdue</p>
        </div>
      </div>

      <ul className="space-y-3">
        {properties.map((p) => (
          <li key={p.id}>
            <TrackCard property={p} onManage={onManage} />
          </li>
        ))}
      </ul>
    </div>
  );
}
