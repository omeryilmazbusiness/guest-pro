/**
 * RestaurantCareInsightsTab
 * AI-powered analysis of guest care profiles → actionable food/nutrition tips.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, RefreshCw, Sparkles, Info } from "lucide-react";
import { getCareInsights, refreshCareInsights, type RestaurantCareInsight } from "@/lib/restaurant";

function today() { return new Date().toISOString().split("T")[0]; }

export function RestaurantCareInsightsTab() {
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
        updated
      );
      toast.success("Öneriler güncellendi");
    } catch {
      toast.error("Analiz yapılamadı");
    } finally {
      setIsRefreshing(false);
    }
  };

  const insights = data?.insights ?? [];
  const sourceCount = data?.sourceRequestCount ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <h2 className="text-[14px] font-semibold text-zinc-700">Care Önerileri</h2>
          {insights.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-400">({insights.length})</span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-zinc-900 text-white text-[12px] font-medium hover:bg-zinc-800 transition-all disabled:opacity-60"
        >
          {isRefreshing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {isRefreshing ? "Analiz ediliyor…" : "AI ile Yenile"}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
        <p className="text-[12px] text-rose-700 leading-relaxed">
          Bu liste misafirlerin gönderdiği <strong>Care About Me</strong> profillerinden
          yapay zeka tarafından analiz edilmektedir. Yalnızca yiyecek ve beslenmeyle
          ilgili öneriler listelenir.
          {sourceCount > 0 && (
            <span className="block mt-1 text-rose-500">
              Son analiz: {sourceCount} care profili incelendi · {data?.date}
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-2xl h-14 animate-pulse" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center py-12 bg-white rounded-2xl border border-zinc-100 gap-3">
          <Heart className="w-8 h-8 text-zinc-200" />
          <p className="text-[13px] font-medium text-zinc-600">Henüz öneri yok</p>
          <p className="text-[11px] text-zinc-400 text-center max-w-[220px]">
            Misafirler Care About Me doldurmaya başladığında AI analiz edecek.
            Yenile butonuna basarak mevcut profilleri analiz edebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, idx) => {
            // Parse "Oda XXX (Name): Situation → Suggestion" rich format
            const richMatch = insight.match(/^Oda\s+(\S+)\s*\(([^)]+)\):\s*([^→]+)→\s*(.+)$/);
            // Fallback: "Oda XXX: …" without arrow
            const simpleMatch = !richMatch ? insight.match(/^Oda\s+(\S+):\s*(.+)$/) : null;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-rose-100 shadow-sm px-4 py-3 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Heart className="w-3 h-3 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {richMatch ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-rose-500">Oda {richMatch[1]}</span>
                        <span className="text-[11px] text-zinc-400">· {richMatch[2].trim()}</span>
                      </div>
                      <p className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded-lg px-2 py-0.5 inline-block mb-1.5">
                        {richMatch[3].trim()}
                      </p>
                      <p className="text-[13px] text-zinc-700 leading-relaxed">{richMatch[4].trim()}</p>
                    </>
                  ) : simpleMatch ? (
                    <>
                      <p className="text-[11px] font-semibold text-rose-500 mb-0.5">Oda {simpleMatch[1]}</p>
                      <p className="text-[13px] text-zinc-700 leading-relaxed">{simpleMatch[2]}</p>
                    </>
                  ) : (
                    <p className="text-[13px] text-zinc-700 leading-relaxed">{insight}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
