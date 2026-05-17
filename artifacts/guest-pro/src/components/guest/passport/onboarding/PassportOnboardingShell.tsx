/**
 * PassportOnboardingShell — pure black luxury canvas (welcome | compact).
 */

import { KioskBrandHeader } from "@/components/kiosk/KioskBrandHeader";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type OnboardingShellVariant = "welcome" | "compact";

interface PassportOnboardingShellProps {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
  showHeader?: boolean;
  variant?: OnboardingShellVariant;
}

export function PassportOnboardingShell({
  children,
  dir = "ltr",
  className,
  showHeader = true,
  variant = "compact",
}: PassportOnboardingShellProps) {
  const isWelcome = variant === "welcome";

  return (
    <div
      dir={dir}
      className={cn(
        "passport-onboarding fixed inset-0 z-40 overflow-hidden flex flex-col",
        "bg-black",
        className,
      )}
    >
      {isWelcome ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <div className="passport-welcome-vignette" aria-hidden="true" />
        </>
      ) : (
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          aria-hidden="true"
        />
      )}

      {showHeader && <KioskBrandHeader variant="embedded" />}

      <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
