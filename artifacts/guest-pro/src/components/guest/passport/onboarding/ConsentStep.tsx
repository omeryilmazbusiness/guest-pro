/**
 * Step 3 — compact privacy consent before camera.
 */

import { Shield } from "lucide-react";
import type { PassportOnboardingStrings } from "@/lib/passport/onboarding/types";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { getPassportLanguageEntry } from "@/lib/passport/onboarding/languages";
import { PassportOnboardingShell } from "./PassportOnboardingShell";
import { PremiumCtaButton } from "./primitives/PremiumCtaButton";

interface ConsentStepProps {
  locale: PassportOnboardingLocale;
  strings: PassportOnboardingStrings;
  onAccept: () => void;
}

export function ConsentStep({ locale, strings, onAccept }: ConsentStepProps) {
  const dir = getPassportLanguageEntry(locale).dir;

  return (
    <PassportOnboardingShell dir={dir} variant="compact" showLogo>
      <div className="flex-1 flex flex-col min-h-0 px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] passport-luxury-enter">
        <header className="text-center mb-4 pt-2">
          <div className="mx-auto w-11 h-11 flex items-center justify-center border border-white/10 mb-4">
            <Shield className="w-5 h-5 text-white/60" strokeWidth={1.25} />
          </div>
          <p className="passport-luxury-label mb-2">{strings.consentTitle}</p>
          <p className="passport-luxury-body max-w-sm mx-auto text-[12px]">
            {strings.consentIntro}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0 passport-luxury-card rounded-sm px-4 py-4">
          <ul className="space-y-3.5">
            {strings.consentBullets.map((bullet, i) => (
              <li
                key={bullet}
                className="flex gap-3 text-[12px] text-white/55 leading-relaxed"
                style={{
                  animationDelay: `${80 + i * 50}ms`,
                  animation:
                    "passport-luxury-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) backwards",
                }}
              >
                <span
                  className="shrink-0 mt-2 w-1 h-1 bg-white/40 rotate-45"
                  aria-hidden="true"
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 pt-2">
          <PremiumCtaButton onClick={onAccept}>{strings.consentAccept}</PremiumCtaButton>
        </div>
      </div>
    </PassportOnboardingShell>
  );
}
