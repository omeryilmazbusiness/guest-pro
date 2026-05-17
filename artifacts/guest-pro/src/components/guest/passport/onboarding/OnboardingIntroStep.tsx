/**
 * Step 2 — Guest Pro quick intro with icon bullets.
 */

import {
  Sparkles,
  ScanLine,
  Camera,
  QrCode,
  ConciergeBell,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { PassportOnboardingStrings } from "@/lib/passport/onboarding/types";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { getPassportLanguageEntry } from "@/lib/passport/onboarding/languages";
import { PassportOnboardingShell } from "./PassportOnboardingShell";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  scan: ScanLine,
  camera: Camera,
  qr: QrCode,
  reception: ConciergeBell,
};

interface OnboardingIntroStepProps {
  locale: PassportOnboardingLocale;
  strings: PassportOnboardingStrings;
  onContinue: () => void;
}

export function OnboardingIntroStep({
  locale,
  strings,
  onContinue,
}: OnboardingIntroStepProps) {
  const dir = getPassportLanguageEntry(locale).dir;

  return (
    <PassportOnboardingShell dir={dir}>
      <div className="flex-1 flex flex-col min-h-0 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-2">
            Guest Pro
          </p>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {strings.introTitle}
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {strings.introSubtitle}
          </p>
        </header>

        <ul className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
          {strings.introItems.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <li
                key={item.title}
                className={cn(
                  "flex gap-4 p-4 rounded-2xl border border-zinc-800/80",
                  "bg-zinc-900/40 backdrop-blur-sm",
                  "animate-in fade-in slide-in-from-bottom-3 duration-500",
                )}
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{item.body}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onContinue}
          className={cn(
            "mt-6 w-full flex items-center justify-center gap-2",
            "py-4 rounded-2xl text-sm font-semibold",
            "bg-white text-zinc-950",
            "hover:bg-zinc-100 active:scale-[0.98] transition-all duration-150",
            "shadow-[0_8px_32px_rgba(255,255,255,0.12)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          )}
        >
          {strings.introContinue}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </PassportOnboardingShell>
  );
}
