/**
 * CountryFlag
 *
 * Centralized, professional flag display component.
 * Uses the `flag-icons` CSS library for self-contained SVG-quality flag rendering.
 * No emoji, no CDN requests — flags render offline and in PWA contexts.
 *
 * Usage:
 *   <CountryFlag code="DE" />          ← default small (20×15)
 *   <CountryFlag code="TR" size="md" /> ← medium (28×21)
 *
 * Architecture note:
 *   All country-to-flag resolution lives here. Components never construct
 *   flag CSS classes directly — they import and render CountryFlag.
 */

import "flag-icons/css/flag-icons.min.css";

export type FlagSize = "sm" | "md" | "lg";

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 country code (case-insensitive). */
  code: string;
  /**
   * Visual size of the flag:
   *   sm — 20×15 (default, for inline list items)
   *   md — 24×18 (for cards and detail views)
   *   lg — 32×24 (for modals and handoff screens)
   */
  size?: FlagSize;
  className?: string;
}

const SIZE_MAP: Record<FlagSize, { width: number; height: number }> = {
  sm: { width: 20, height: 15 },
  md: { width: 24, height: 18 },
  lg: { width: 32, height: 24 },
};

export function CountryFlag({ code, size = "sm", className = "" }: CountryFlagProps) {
  const cc = code.toLowerCase().replace(/[^a-z]/g, "");
  const { width, height } = SIZE_MAP[size];

  if (!cc || cc.length !== 2) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-zinc-100 rounded-sm text-[10px] text-zinc-400 font-mono ${className}`}
        style={{ width, height }}
        aria-hidden="true"
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={`fi fi-${cc} rounded-sm overflow-hidden shrink-0 ${className}`}
      style={{ display: "inline-block", width, height, lineHeight: 0 }}
      role="img"
      aria-label={`${code.toUpperCase()} flag`}
      title={code.toUpperCase()}
    />
  );
}
