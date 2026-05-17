/**
 * Step 1 — luxury black welcome, typewriter + tap to select language.
 */

import { useCallback, useEffect, useState } from "react";
import {
  PASSPORT_WELCOME_LANGUAGES,
  formatWelcome,
} from "@/lib/passport/onboarding/languages";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { PassportOnboardingShell } from "./PassportOnboardingShell";
import { PremiumTypewriter } from "./primitives/PremiumTypewriter";
import { cn } from "@/lib/utils";

interface WelcomeLanguageStepProps {
  hotelName: string;
  tapHint: string;
  onSelect: (locale: PassportOnboardingLocale) => void;
}

export function WelcomeLanguageStep({
  hotelName,
  tapHint,
  onSelect,
}: WelcomeLanguageStepProps) {
  const [index, setIndex] = useState(0);
  const [showLang, setShowLang] = useState(false);

  const current = PASSPORT_WELCOME_LANGUAGES[index];
  const welcomeText = formatWelcome(current.welcomeTemplate, hotelName);

  const advanceCycle = useCallback(() => {
    setShowLang(false);
    setIndex((i) => (i + 1) % PASSPORT_WELCOME_LANGUAGES.length);
  }, []);

  useEffect(() => {
    setShowLang(false);
    const t = window.setTimeout(() => setShowLang(true), 720);
    return () => window.clearTimeout(t);
  }, [index]);

  return (
    <PassportOnboardingShell dir={current.dir} showLogo={false} variant="welcome">
      <button
        type="button"
        onClick={() => onSelect(current.locale)}
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-6",
          "pb-[max(2.5rem,env(safe-area-inset-bottom))]",
          "cursor-pointer focus-visible:outline-none",
          "focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-4 focus-visible:ring-offset-black",
        )}
        aria-label={`${welcomeText}. ${tapHint}`}
      >
        <div className="w-full max-w-lg flex flex-col items-center gap-12 select-none min-h-[42vh] justify-center">
          <div className="w-full min-h-[7.5rem] flex items-center justify-center">
            <PremiumTypewriter
              key={`tw-${index}-${current.locale}`}
              text={welcomeText}
              dir={current.dir}
              lang={current.locale}
              locale={current.locale}
              onCycleComplete={advanceCycle}
            />
          </div>

          <div className="flex flex-col items-center gap-5">
            <span
              className={cn(
                "passport-luxury-label transition-all duration-[900ms] ease-out",
                showLang ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              )}
              dir={current.dir}
              style={
                showLang
                  ? { animation: "passport-lang-fade 0.9s ease-out forwards" }
                  : undefined
              }
            >
              {current.label}
            </span>

            <div className="flex gap-2.5">
              {PASSPORT_WELCOME_LANGUAGES.map((lang, i) => (
                <span
                  key={lang.locale}
                  className={cn(
                    "h-px rounded-full transition-all duration-700 ease-out",
                    i === index ? "w-10 bg-white/80" : "w-3 bg-white/15",
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>

        <p
          className={cn(
            "mt-16 text-[11px] text-center max-w-xs tracking-[0.12em]",
            "text-white/30 font-light transition-opacity duration-700",
          )}
        >
          {tapHint}
        </p>
      </button>
    </PassportOnboardingShell>
  );
}
