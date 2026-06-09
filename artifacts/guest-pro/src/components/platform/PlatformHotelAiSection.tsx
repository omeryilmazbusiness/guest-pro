/**
 * PlatformHotelAiSection — per-hotel AI token budget & feature toggles.
 */

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getHotelAiConfig,
  updateHotelAiConfig,
  type PlatformHotel,
} from "@/lib/platform-api";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function PlatformHotelAiSection({ hotel }: { hotel: PlatformHotel }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["platform-hotel-ai", hotel.id],
    queryFn: () => getHotelAiConfig(hotel.id),
    enabled: !!hotel.id,
  });

  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [useCustomBudget, setUseCustomBudget] = useState(false);
  const [maxTask, setMaxTask] = useState("");
  const [maxDaily, setMaxDaily] = useState("");
  const [maxQuick, setMaxQuick] = useState("");
  const [taskEnabled, setTaskEnabled] = useState(true);
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [quickEnabled, setQuickEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const { config, usage } = data;
    setUseCustomBudget(config.monthlyTokenBudget != null);
    setMonthlyBudget(
      config.monthlyTokenBudget != null ? String(config.monthlyTokenBudget) : String(usage.monthlyBudget),
    );
    setMaxTask(
      config.maxOutputTokensTaskReport != null
        ? String(config.maxOutputTokensTaskReport)
        : String(data.effectiveMaxOutput.task_report),
    );
    setMaxDaily(
      config.maxOutputTokensDailySummary != null
        ? String(config.maxOutputTokensDailySummary)
        : String(data.effectiveMaxOutput.daily_summary),
    );
    setMaxQuick(
      config.maxOutputTokensQuickReport != null
        ? String(config.maxOutputTokensQuickReport)
        : String(data.effectiveMaxOutput.quick_report),
    );
    setTaskEnabled(config.taskReportsEnabled);
    setDailyEnabled(config.dailySummariesEnabled);
    setQuickEnabled(config.quickReportsEnabled);
  }, [data]);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateHotelAiConfig(hotel.id, {
        monthlyTokenBudget: useCustomBudget ? parseInt(monthlyBudget, 10) || 0 : null,
        maxOutputTokensTaskReport: maxTask ? parseInt(maxTask, 10) : null,
        maxOutputTokensDailySummary: maxDaily ? parseInt(maxDaily, 10) : null,
        maxOutputTokensQuickReport: maxQuick ? parseInt(maxQuick, 10) : null,
        taskReportsEnabled: taskEnabled,
        dailySummariesEnabled: dailyEnabled,
        quickReportsEnabled: quickEnabled,
      });
      toast.success("AI settings saved");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotel-ai", hotel.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  const { usage } = data;
  const barPct = Math.min(100, usage.usagePercent);

  return (
    <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-zinc-900">AI token budget</h3>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {usage.periodKey} · {usage.requestCount} requests
          </span>
          <span className="font-semibold tabular-nums text-zinc-800">
            {formatTokens(usage.tokensUsed)} / {formatTokens(usage.monthlyBudget)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all ${
              barPct >= 90 ? "bg-red-500" : barPct >= 70 ? "bg-amber-500" : "bg-violet-500"
            }`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
          <span>Tasks: {formatTokens(usage.byFeature.taskReport)}</span>
          <span>Daily: {formatTokens(usage.byFeature.dailySummary)}</span>
          <span>Quick: {formatTokens(usage.byFeature.quickReport)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`custom-budget-${hotel.id}`} className="text-sm text-zinc-700">
          Custom monthly budget
        </Label>
        <Switch
          id={`custom-budget-${hotel.id}`}
          checked={useCustomBudget}
          onCheckedChange={setUseCustomBudget}
        />
      </div>

      {useCustomBudget && (
        <div className="space-y-1.5">
          <Label>Monthly tokens</Label>
          <Input
            type="number"
            min={0}
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            className="rounded-xl font-mono text-sm"
          />
          <p className="text-xs text-zinc-500">
            Leave off to use plan default ({hotel.planTier}).
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Task report max</Label>
          <Input
            type="number"
            value={maxTask}
            onChange={(e) => setMaxTask(e.target.value)}
            className="h-9 rounded-lg font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Daily max</Label>
          <Input
            type="number"
            value={maxDaily}
            onChange={(e) => setMaxDaily(e.target.value)}
            className="h-9 rounded-lg font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-zinc-400">Quick max</Label>
          <Input
            type="number"
            value={maxQuick}
            onChange={(e) => setMaxQuick(e.target.value)}
            className="h-9 rounded-lg font-mono text-xs"
          />
        </div>
      </div>
      <p className="text-[11px] text-zinc-500">Max output tokens per Gemini call (empty = platform default).</p>

      <div className="space-y-2">
        {[
          { id: "task", label: "Task AI reports", checked: taskEnabled, onChange: setTaskEnabled },
          { id: "daily", label: "Daily summaries", checked: dailyEnabled, onChange: setDailyEnabled },
          { id: "quick", label: "Quick reports", checked: quickEnabled, onChange: setQuickEnabled },
        ].map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
            <span className="text-sm text-zinc-700">{row.label}</span>
            <Switch checked={row.checked} onCheckedChange={row.onChange} />
          </div>
        ))}
      </div>

      <Button
        type="button"
        className="h-10 w-full rounded-xl"
        disabled={saving}
        onClick={onSave}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save AI settings"}
      </Button>
    </div>
  );
}
