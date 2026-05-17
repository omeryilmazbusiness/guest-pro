/**
 * PremiumCtaButton — shared luxury CTA for onboarding steps.
 */

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumCtaButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "solid" | "outline";
  className?: string;
}

export function PremiumCtaButton({
  children,
  onClick,
  variant = "solid",
  className,
}: PremiumCtaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "passport-luxury-cta w-full flex items-center justify-center gap-2",
        "py-3.5 rounded-2xl",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40",
        "active:scale-[0.99]",
        variant === "solid" &&
          "bg-white text-black hover:bg-zinc-100 shadow-[0_12px_40px_rgba(255,255,255,0.08)]",
        variant === "outline" &&
          "border border-white/20 text-white/90 hover:bg-white/5 hover:border-white/35",
        className,
      )}
    >
      {children}
      <ChevronRight className="w-3.5 h-3.5 opacity-70" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
