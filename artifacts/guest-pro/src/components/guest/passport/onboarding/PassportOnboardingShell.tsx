/**
 * Shared luxury black canvas for passport onboarding steps.
 */

import { GuestProLogo } from "@/components/GuestProLogo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PassportOnboardingShellProps {
  children: ReactNode;
  dir?: "ltr" | "rtl";
  className?: string;
  showLogo?: boolean;
}

export function PassportOnboardingShell({
  children,
  dir = "ltr",
  className,
  showLogo = true,
}: PassportOnboardingShellProps) {
  return (
    <div
      dir={dir}
      className={cn(
        "fixed inset-0 z-40 bg-zinc-950 overflow-hidden flex flex-col",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-[20%] left-1/2 -translate-x-1/2 w-[140%] h-[55%] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.14) 0%, transparent 68%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[45%] opacity-20"
        style={{
          background:
            "linear-gradient(to top, rgba(255,255,255,0.08), transparent 55%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {showLogo && (
        <div className="relative z-10 pt-[max(1.25rem,env(safe-area-inset-top))] flex justify-center opacity-40">
          <GuestProLogo variant="header" className="w-6 h-6 invert" />
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
