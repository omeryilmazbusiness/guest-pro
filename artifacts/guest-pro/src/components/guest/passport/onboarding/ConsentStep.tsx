/**
 * Step 3 — Privacy & permissions consent before camera.
 */

import { Shield, ChevronRight } from "lucide-react";
import type { PassportOnboardingStrings } from "@/lib/passport/onboarding/types";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { getPassportLanguageEntry } from "@/lib/passport/onboarding/languages";
import { PassportOnboardingShell } from "./PassportOnboardingShell";
import { cn } from "@/lib/utils";

interface ConsentStepProps {
  locale: PassportOnboardingLocale;
  strings: PassportOnboardingStrings;
  onAccept: () => void;
}

export function ConsentStep({ locale, strings, onAccept }: ConsentStepProps) {
  const dir = getPassportLanguageEntry(locale).dir;

  return (
    <PassportOnboardingShell dir={dir}>
      <div className="flex-1 flex flex-col min-h-0 px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="text-center mb-6 animate-in fade-in duration-500">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {strings.consentTitle}
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {strings.consentIntro}
          </p>
        </header>

        <div
          className={cn(
            "flex-1 overflow-y-auto min-h-0 rounded-2xl border border-zinc-800/80",
            "bg-zinc-900/50 backdrop-blur-sm px-5 py-5",
          )}
        >
          <ul className="space-y-4">
            {strings.consentBullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                <span
                  className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-white/60"
                  aria-hidden="true"
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onAccept}
          className={cn(
            "mt-6 w-full flex items-center justify-center gap-2",
            "py-4 rounded-2xl text-sm font-semibold",
            "bg-white text-zinc-950",
            "hover:bg-zinc-100 active:scale-[0.98] transition-all duration-150",
            "shadow-[0_8px_32px_rgba(255,255,255,0.12)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          )}
        >
          {strings.consentAccept}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </PassportOnboardingShell>
  );
}
