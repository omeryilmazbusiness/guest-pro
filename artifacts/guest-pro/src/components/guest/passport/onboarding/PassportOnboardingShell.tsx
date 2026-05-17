/**
 * PassportOnboardingShell — pure black luxury canvas (welcome | compact).
 */

import { GuestProLogo } from "@/components/GuestProLogo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type OnboardingShellVariant = "welcome" | "compact";

interface PassportOnboardingShellProps {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
  showLogo?: boolean;
  variant?: OnboardingShellVariant;
}

export function PassportOnboardingShell({
  children,
  dir = "ltr",
  className,
  showLogo = true,
  variant = "compact",
}: PassportOnboardingShellProps) {
  const isWelcome = variant === "welcome";

  return (
    <div
      dir={dir}
      className={cn(
        "fixed inset-0 z-40 overflow-hidden flex flex-col",
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

      {showLogo && (
        <div
          className={cn(
            "relative z-10 flex justify-center",
            isWelcome ? "pt-[max(1.5rem,env(safe-area-inset-top))] opacity-25" : "pt-[max(0.75rem,env(safe-area-inset-top))] opacity-30",
          )}
        >
          <GuestProLogo variant="header" className="w-5 h-5 invert" />
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
