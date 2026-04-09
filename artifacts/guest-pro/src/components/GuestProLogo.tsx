import logoUrl from "@assets/Gemini_Generated_Image_bnqhycbnqhycbnqh-removebg-preview_1775747739132.png";

interface GuestProLogoProps {
  /**
   * `login`  — larger hero size (shown centered above the login title)
   * `header` — compact size for top-left header brand areas
   */
  variant?: "login" | "header";
  className?: string;
}

/**
 * Official Guest Pro logo asset.
 *
 * The image has a transparent background with dark linework — it renders
 * correctly on any light surface. For dark surfaces, wrap with a white
 * container or apply `invert` via className.
 *
 * Usage:
 *   <GuestProLogo />                     ← compact header size
 *   <GuestProLogo variant="login" />     ← hero size for the login screen
 */
export function GuestProLogo({ variant = "header", className = "" }: GuestProLogoProps) {
  const sizeClass = variant === "login" ? "w-14 h-14" : "w-6 h-6";

  return (
    <img
      src={logoUrl}
      alt="Guest Pro"
      aria-hidden="true"
      draggable={false}
      className={`${sizeClass} object-contain select-none pointer-events-none ${className}`}
    />
  );
}
