/**
 * CountryFlag
 *
 * Centralized country indicator component for Guest Pro.
 * Two visual modes:
 *
 *   default   — full-color SVG flag via `flag-icons` CSS library
 *   monochrome — grayscale-filtered version for operational/staff contexts
 *
 * Usage:
 *   <CountryFlag code="DE" />                  ← color (guest-facing forms)
 *   <CountryFlag code="TR" size="md" monochrome /> ← B&W (staff operations)
 *
 * Architecture:
 *   All country-to-indicator resolution is centralized here.
 *   Components never construct `fi-*` CSS classes or apply grayscale filters
 *   themselves — they import and render CountryFlag.
 *
 * Offline / PWA safe — no CDN, no network requests.
 */

import "flag-icons/css/flag-icons.min.css";

export type FlagSize = "sm" | "md" | "lg";

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 country code (case-insensitive). */
  code: string;
  /**
   * Visual size:
   *   sm — 18×14  (default, for inline list items and compact card rows)
   *   md — 22×17  (for detail views and room card back)
   *   lg — 28×21  (for modals and handoff screens)
   */
  size?: FlagSize;
  /**
   * Monochrome mode — renders the flag desaturated for premium operational contexts.
   * Use in staff-facing room cards, guest rows in operational views.
   * Default: false (full color for guest-facing and form contexts).
   */
  monochrome?: boolean;
  className?: string;
}

const SIZE_MAP: Record<FlagSize, { width: number; height: number }> = {
  sm: { width: 18, height: 14 },
  md: { width: 22, height: 17 },
  lg: { width: 28, height: 21 },
};

export function CountryFlag({
  code,
  size = "sm",
  monochrome = false,
  className = "",
}: CountryFlagProps) {
  const cc = code.toLowerCase().replace(/[^a-z]/g, "");
  const { width, height } = SIZE_MAP[size];

  if (!cc || cc.length !== 2) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-zinc-100 rounded-sm text-[9px] text-zinc-400 font-mono font-semibold tracking-widest ${className}`}
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
      style={{
        display: "inline-block",
        width,
        height,
        lineHeight: 0,
        // Monochrome: desaturate + slight dimming for premium hospitality B&W ops theme
        filter: monochrome ? "grayscale(1) brightness(0.88) contrast(1.05)" : undefined,
      }}
      role="img"
      aria-label={`${code.toUpperCase()} flag`}
      title={code.toUpperCase()}
    />
  );
}
