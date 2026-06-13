/**
 * RestaurantCareInsightsTab — AI kitchen rules from guest Care About Me profiles.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChefHat, RefreshCw, Sparkles, Info, ShieldCheck } from "lucide-react";
import { getCareInsights, refreshCareInsights, type RestaurantCareInsight } from "@/lib/restaurant";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { cn } from "@/lib/utils";

const RULE_CARD =
  "rounded-xl border border-zinc-200/90 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

function today() {
  return new Date().toISOString().split("T")[0];
}

export function RestaurantCareInsightsTab() {
  const { t } = useStaffLocale();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["restaurant-care-insights", today()],
    queryFn: () => getCareInsights(today()),
    staleTime: 5 * 60_000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updated = await refreshCareInsights();
      queryClient.setQueryData<RestaurantCareInsight>(
        ["restaurant-care-insights", today()],
        updated,
      );
      toast.success(t.careRefreshed);
    } catch {
      toast.error(t.careRefreshFailed);
    } finally {
      setIsRefreshing(false);
    }
  };

  const insights = (data?.insights ?? []).slice(0, 3);
  const sourceCount = data?.sourceRequestCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="guest-chat-entry-icon shrink-0">
            <ChefHat className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-zinc-800 truncate">{t.careTitle}</h2>
            <p className="text-[11px] text-zinc-400">{t.careKitchenRulesSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-900 text-white text-[12px] font-medium hover:bg-zinc-800 transition-all disabled:opacity-60 shrink-0"
        >
          {isRefreshing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {isRefreshing ? t.careRefreshing : t.careRefreshBtn}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[12px] text-zinc-600 leading-relaxed">{t.careBannerDescription}</p>
          {sourceCount > 0 && data?.date && (
            <p className="mt-1.5 text-[11px] text-zinc-400">
              {t.careLastAnalysis
                .replace("{n}", String(sourceCount))
                .replace("{date}", data.date)}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-xl h-[52px] animate-pulse" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center py-12 rounded-xl border border-zinc-200/80 bg-white gap-3">
          <div className="guest-chat-entry-icon">
            <ShieldCheck className="w-5 h-5 text-zinc-300" />
          </div>
          <p className="text-[13px] font-medium text-zinc-600">{t.careNoInsights}</p>
          <p className="text-[11px] text-zinc-400 text-center max-w-[240px] leading-relaxed">
            {t.careNoInsightsHint}
          </p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {insights.map((insight, idx) => (
            <li key={idx} className={cn(RULE_CARD, "flex items-start gap-3")}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                {idx + 1}
              </span>
              <p className="flex-1 text-[13px] text-zinc-700 leading-relaxed pt-0.5">{insight}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
