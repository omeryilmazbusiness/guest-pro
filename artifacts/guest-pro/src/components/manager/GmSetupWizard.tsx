import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Building2, Check, ChevronRight, LayoutGrid, MapPin, Wifi, X } from "lucide-react";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import {
  SETUP_GUEST_SETTINGS_PATH,
  SETUP_STEP_ANCHORS,
  dismissHotelSetupWizard,
  fetchHotelSetupStatus,
  type HotelSetupStep,
} from "@/lib/hotel-setup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STEP_ICONS = {
  about: Building2,
  services: LayoutGrid,
  wifi: Wifi,
  nearby: MapPin,
} as const;

function stepMeta(
  stepId: string,
  t: ReturnType<typeof useStaffLocale>["t"],
): { title: string; description: string } {
  const map: Record<string, { title: string; description: string }> = {
    about: { title: t.setupStepAbout, description: t.setupStepAboutDesc },
    services: { title: t.setupStepServices, description: t.setupStepServicesDesc },
    wifi: { title: t.setupStepWifi, description: t.setupStepWifiDesc },
    nearby: { title: t.setupStepNearby, description: t.setupStepNearbyDesc },
  };
  return map[stepId] ?? { title: stepId, description: "" };
}

export function GmSetupWizard() {
  const navigate = useTenantNav();
  const [location] = useLocation();
  const { t } = useStaffLocale();
  const { appName } = useHotelDisplay();
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const [steps, setSteps] = useState<HotelSetupStep[]>([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchHotelSetupStatus();
      setSteps(data.steps);
      setPercent(data.completion.percent);

      if (data.dismissed) {
        setVisible(false);
        setShowCongrats(false);
        return;
      }

      if (data.completion.isComplete) {
        setVisible(true);
        setShowCongrats(true);
        return;
      }

      setVisible(true);
      setShowCongrats(false);
      const next = data.steps.find((s) => !s.done);
      setActiveStepId(next?.id ?? data.steps[0]?.id ?? null);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, location]);

  useEffect(() => {
    const onFocus = () => void load();
    const onSetupChanged = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("hotel-setup-changed", onSetupChanged);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hotel-setup-changed", onSetupChanged);
    };
  }, [load]);

  const goToStep = (stepId: string) => {
    const hash = SETUP_STEP_ANCHORS[stepId];
    navigate(`${SETUP_GUEST_SETTINGS_PATH}${hash ? `#${hash}` : ""}`);
  };

  const dismiss = async () => {
    try {
      await dismissHotelSetupWizard();
    } catch {
      /* hide locally */
    }
    setVisible(false);
  };

  const handleCongratsClose = async (open: boolean) => {
    if (open) return;
    setShowCongrats(false);
    try {
      await dismissHotelSetupWizard();
    } catch {
      /* hide locally */
    }
    setVisible(false);
  };

  if (!visible && !showCongrats) return null;

  const nextStep = steps.find((s) => !s.done);
  const currentStepId = activeStepId ?? nextStep?.id ?? steps[0]?.id;
  const currentMeta = currentStepId ? stepMeta(currentStepId, t) : null;

  return (
    <>
      {visible && !showCongrats && (
        <div className="border-b border-zinc-100 bg-zinc-50/40 px-4 py-2.5">
          <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200/80 bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  {t.setupWizardEyebrow}
                </p>
                <h2 className="mt-0.5 text-[13px] font-semibold text-zinc-900">{t.setupWizardTitle}</h2>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">{t.setupWizardSubtitle}</p>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                <span className="text-[15px] font-semibold tabular-nums text-zinc-900">{percent}%</span>
                <button
                  type="button"
                  onClick={() => void dismiss()}
                  className="rounded p-0.5 text-zinc-400 hover:text-zinc-600"
                  aria-label={t.cancel}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <ol className="mt-3 grid grid-cols-4 gap-1">
              {steps.map((step) => {
                const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS] ?? Building2;
                const meta = stepMeta(step.id, t);
                const isCurrent = step.id === currentStepId;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStepId(step.id);
                        goToStep(step.id);
                      }}
                      className="flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-1 transition-colors hover:bg-zinc-50"
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                          step.done
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : isCurrent
                              ? "border-zinc-900 bg-white text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-400"
                        }`}
                      >
                        {step.done ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span
                        className={`text-center text-[9px] font-medium leading-tight ${
                          step.done || isCurrent ? "text-zinc-800" : "text-zinc-400"
                        }`}
                      >
                        {meta.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {currentMeta && (
              <p className="mt-2.5 rounded-lg bg-zinc-50 px-2.5 py-2 text-[11px] leading-snug text-zinc-600">
                <span className="font-medium text-zinc-800">{currentMeta.title}</span>
                {" — "}
                {currentMeta.description}
              </p>
            )}

            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            {nextStep && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2.5 h-7 w-full rounded-lg border-zinc-200 text-[11px] font-medium text-zinc-800 hover:bg-zinc-50"
                onClick={() => goToStep(nextStep.id)}
              >
                {t.setupWizardContinue.replace("{step}", stepMeta(nextStep.id, t).title)}
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog open={showCongrats} onOpenChange={(open) => void handleCongratsClose(open)}>
        <DialogContent className="max-w-sm overflow-hidden rounded-2xl border-zinc-200 p-0">
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white">
              <Check className="h-5 w-5 text-zinc-900" strokeWidth={2} />
            </div>
            <DialogHeader className="mt-3 space-y-1 text-center">
              <DialogTitle className="text-[16px] font-semibold text-zinc-950">
                {t.setupCompleteTitle}
              </DialogTitle>
              <DialogDescription className="text-[12px] leading-relaxed text-zinc-500">
                {t.setupCompleteBody.replace("{hotel}", appName)}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-3">
            <Button
              type="button"
              className="h-9 w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={() => void handleCongratsClose(false)}
            >
              {t.setupCompleteCta}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
