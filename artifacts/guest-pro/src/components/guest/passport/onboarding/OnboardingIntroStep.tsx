/**
 * Step 2 — compact premium intro with icon bullets.
 */

import {
  Sparkles,
  ScanLine,
  Camera,
  QrCode,
  ConciergeBell,
  type LucideIcon,
} from "lucide-react";
import type { PassportOnboardingStrings } from "@/lib/passport/onboarding/types";
import type { PassportOnboardingLocale } from "@/lib/passport/onboarding/types";
import { getPassportLanguageEntry } from "@/lib/passport/onboarding/languages";
import { PassportOnboardingShell } from "./PassportOnboardingShell";
import { PremiumCtaButton } from "./primitives/PremiumCtaButton";
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
    <PassportOnboardingShell dir={dir} variant="compact">
      <div className="flex-1 flex flex-col min-h-0 px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] passport-luxury-enter">
        <header className="text-center mb-5 pt-2">
          <h2 className="passport-luxury-title text-2xl">{strings.introTitle}</h2>
          <p className="mt-2 passport-luxury-body max-w-xs mx-auto">{strings.introSubtitle}</p>
        </header>

        <ul className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {strings.introItems.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <li
                key={item.title}
                className={cn(
                  "passport-luxury-card flex gap-3 p-3 rounded-sm",
                  "transition-all duration-500",
                )}
                style={{
                  animationDelay: `${120 + i * 70}ms`,
                  animation: "passport-luxury-reveal 0.85s cubic-bezier(0.22, 1, 0.36, 1) backwards",
                }}
              >
                <div className="shrink-0 w-9 h-9 flex items-center justify-center border border-white/8">
                  <Icon className="w-4 h-4 text-white/70" strokeWidth={1.25} />
                </div>
                <div className="min-w-0">
                  <p className="passport-luxury-title text-[14px] text-white/90">
                    {item.title}
                  </p>
                  <p className="mt-0.5 passport-luxury-body text-[12px] text-white/45">{item.body}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 pt-2">
          <PremiumCtaButton onClick={onContinue}>{strings.introContinue}</PremiumCtaButton>
        </div>
      </div>
    </PassportOnboardingShell>
  );
}
