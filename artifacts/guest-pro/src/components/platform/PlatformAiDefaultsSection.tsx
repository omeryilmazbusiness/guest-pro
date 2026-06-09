/**
 * PlatformAiDefaultsSection — platform-wide AI token defaults (Settings tab).
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformAiDefaults } from "@/lib/platform-api";

interface PlatformAiDefaultsSectionProps {
  defaults: PlatformAiDefaults | undefined;
  loading: boolean;
  saving: boolean;
  onSave: (ai: PlatformAiDefaults) => void;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-600">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl font-mono text-sm"
      />
    </div>
  );
}

export function PlatformAiDefaultsSection({
  defaults,
  loading,
  saving,
  onSave,
}: PlatformAiDefaultsSectionProps) {
  const [form, setForm] = useState<PlatformAiDefaults | null>(null);

  useEffect(() => {
    if (defaults) setForm(defaults);
  }, [defaults]);

  if (loading || !form) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  const set = (key: keyof PlatformAiDefaults, val: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: parseInt(val, 10) || 0 } : prev));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-zinc-500">
        Monthly Gemini token budgets by plan tier and default max output per manager AI feature.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Starter monthly budget"
          value={String(form.starterMonthlyBudget)}
          onChange={(v) => set("starterMonthlyBudget", v)}
        />
        <Field
          label="Growth monthly budget"
          value={String(form.growthMonthlyBudget)}
          onChange={(v) => set("growthMonthlyBudget", v)}
        />
        <Field
          label="Enterprise monthly budget"
          value={String(form.enterpriseMonthlyBudget)}
          onChange={(v) => set("enterpriseMonthlyBudget", v)}
        />
        <Field
          label="Fallback monthly budget"
          value={String(form.defaultMonthlyTokenBudget)}
          onChange={(v) => set("defaultMonthlyTokenBudget", v)}
        />
      </div>

      <div className="border-t border-zinc-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Max output tokens per call
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Task report"
            value={String(form.defaultMaxOutputTaskReport)}
            onChange={(v) => set("defaultMaxOutputTaskReport", v)}
          />
          <Field
            label="Daily summary"
            value={String(form.defaultMaxOutputDailySummary)}
            onChange={(v) => set("defaultMaxOutputDailySummary", v)}
          />
          <Field
            label="Quick report"
            value={String(form.defaultMaxOutputQuickReport)}
            onChange={(v) => set("defaultMaxOutputQuickReport", v)}
          />
        </div>
      </div>

      <Button type="submit" className="h-11 w-full rounded-xl" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save AI defaults"}
      </Button>
    </form>
  );
}
