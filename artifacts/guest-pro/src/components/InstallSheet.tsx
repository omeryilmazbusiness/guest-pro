/**
 * InstallSheet — centered guide to add Guest Pro to the home screen (iOS / manual).
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Ellipsis, Share2, ChevronsDown, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseInstallPromptReturn } from "@/hooks/use-install-prompt";
import { useLocale } from "@/hooks/use-locale";

const MODAL_EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

interface Props {
  install: UseInstallPromptReturn;
}

export function InstallSheet({ install }: Props) {
  const {
    showSheet,
    canNativeInstall,
    isIOS,
    triggerInstall,
    dismiss,
    dismissPermanent,
  } = install;

  const { t } = useLocale();

  useEffect(() => {
    if (!showSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [showSheet, dismiss]);

  if (!showSheet) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center",
        "px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
      role="presentation"
    >
      <button
        type="button"
        className={cn("absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in", MODAL_EASE)}
        aria-label={t.cancel}
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.installTitle}
        className={cn(
          "relative z-10 flex w-full max-w-[min(100%,22rem)] max-h-[min(90dvh,560px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl",
          "animate-in fade-in zoom-in-95",
          MODAL_EASE,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 shadow-md shadow-zinc-900/20">
              <AppIcon />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-semibold leading-snug text-zinc-900">{t.installTitle}</p>
              <p className="mt-0.5 text-[12px] text-zinc-500">Guest Pro · AI Concierge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label={t.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <p className="mb-4 text-[14px] leading-relaxed text-zinc-600">{t.installSubtitle}</p>

          {canNativeInstall && !isIOS ? (
            <NativeInstallCTA
              installNow={t.installNow}
              installLater={t.installLater}
              onInstall={triggerInstall}
              onDismiss={dismiss}
            />
          ) : (
            <HomeScreenSteps t={t} />
          )}

          <button
            type="button"
            onClick={dismissPermanent}
            className="mt-4 w-full py-1 text-center text-[12px] text-zinc-400 transition-colors hover:text-zinc-600"
          >
            {t.installDontShow}
          </button>
        </div>

        <div className="shrink-0 border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-xl bg-zinc-100 py-3 text-[15px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200 active:scale-[0.99]"
          >
            {t.installLater}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function HomeScreenSteps({ t }: { t: ReturnType<typeof useLocale>["t"] }) {
  const steps = [
    {
      icon: Ellipsis,
      title: t.iosStep1Title,
      hint: t.iosStep1Hint,
      iconClass: "text-zinc-700",
      iconBg: "bg-zinc-100",
    },
    {
      icon: Share2,
      title: t.iosStep2Title,
      hint: t.iosStep2Hint,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      icon: ChevronsDown,
      title: t.iosStep3Title,
      hint: t.iosStep3Hint,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      icon: PlusSquare,
      title: t.iosStep4Title,
      hint: t.iosStep4Hint,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
  ] as const;

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.title}>
            <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[12px] font-bold text-zinc-500 shadow-sm">
                {index + 1}
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  step.iconBg,
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", step.iconClass)} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] font-semibold leading-snug text-zinc-900">{step.title}</p>
                {step.hint ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{step.hint}</p>
                ) : null}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function AppIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="24" width="144" height="144" rx="30" fill="#1A1A1A" />
      <path
        d="M96 58C96 58 72 72 72 92C72 106 82 116 96 116C110 116 120 106 120 92C120 72 96 58 96 58Z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="96" cy="130" r="6" fill="white" opacity="0.4" />
      <circle cx="96" cy="130" r="3" fill="white" opacity="0.9" />
    </svg>
  );
}

function NativeInstallCTA({
  installNow,
  installLater,
  onInstall,
  onDismiss,
}: {
  installNow: string;
  installLater: string;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onInstall}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-zinc-900/15 transition-all hover:bg-zinc-800 active:scale-[0.99]"
      >
        <Download className="h-5 w-5 opacity-80" />
        {installNow}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-xl bg-zinc-100 py-3 text-[15px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
      >
        {installLater}
      </button>
    </div>
  );
}
