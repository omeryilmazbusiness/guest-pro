/**
 * Step 1 — cycling "Welcome to {hotel}" in TR → EN → AR → UR; tap to select.
 */

import { useEffect, useState } from "react";
import {
  PASSPORT_WELCOME_LANGUAGES,
  PASSPORT_ONBOARDING_CYCLE_MS,
  formatWelcome,
} from "@/lib/passport/onboarding/languages";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { PassportOnboardingShell } from "./PassportOnboardingShell";
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

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % PASSPORT_WELCOME_LANGUAGES.length);
    }, PASSPORT_ONBOARDING_CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const current = PASSPORT_WELCOME_LANGUAGES[index];
  const welcomeText = formatWelcome(current.welcomeTemplate, hotelName);

  return (
    <PassportOnboardingShell dir={current.dir} showLogo={false}>
      <button
        type="button"
        onClick={() => onSelect(current.locale)}
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-8 pb-[max(2rem,env(safe-area-inset-bottom))]",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        )}
        aria-label={`${welcomeText}. ${tapHint}`}
      >
        <div className="w-full max-w-md flex flex-col items-center gap-10 select-none">
          <div className="relative h-40 w-full flex items-center justify-center overflow-hidden">
            <h1
              key={`welcome-${index}`}
              dir={current.dir}
              lang={current.locale}
              className={cn(
                "absolute text-center font-light tracking-tight text-white",
                "text-3xl sm:text-4xl md:text-[2.75rem] leading-tight",
                "drop-shadow-[0_8px_32px_rgba(255,255,255,0.12)]",
              )}
              style={{
                animation: `passport-welcome-slide ${PASSPORT_ONBOARDING_CYCLE_MS}ms ease-in-out forwards`,
              }}
            >
              {welcomeText}
            </h1>
          </div>

          <div className="relative h-6 w-full flex items-center justify-center overflow-hidden">
            <span
              key={`lang-${index}`}
              dir={current.dir}
              className="absolute text-[11px] font-semibold tracking-[0.35em] uppercase text-zinc-500"
              style={{
                animation: `passport-welcome-slide ${PASSPORT_ONBOARDING_CYCLE_MS}ms ease-in-out forwards`,
              }}
            >
              {current.label}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            {PASSPORT_WELCOME_LANGUAGES.map((lang, i) => (
              <span
                key={lang.locale}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === index ? "w-8 bg-white" : "w-2 bg-zinc-700",
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <p className="mt-14 text-sm text-zinc-500 text-center max-w-xs font-medium tracking-wide animate-pulse">
          {tapHint}
        </p>
      </button>
    </PassportOnboardingShell>
  );
}
