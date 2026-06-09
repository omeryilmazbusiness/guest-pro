import { GuestProLogo } from "@/components/GuestProLogo";
import { HotelLogoImage } from "@/components/HotelLogoImage";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { getHotelLogoSrc } from "@/lib/hotel-logo";
import { cn } from "@/lib/utils";

type HotelBrandMarkVariant = "header" | "drawer" | "compact";

const SIZE: Record<HotelBrandMarkVariant, string> = {
  header: "h-9 w-9",
  drawer: "h-9 w-9",
  compact: "h-8 w-8",
};

interface HotelBrandMarkProps {
  variant?: HotelBrandMarkVariant;
  className?: string;
  framed?: boolean;
  logoUrl?: string | null;
  alt?: string;
}

/**
 * Tenant hotel logo in headers — falls back to Guest Pro mark when no logo is set.
 */
export function HotelBrandMark({
  variant = "header",
  className,
  framed = false,
  logoUrl: logoUrlProp,
  alt: altProp,
}: HotelBrandMarkProps) {
  const tenant = useOptionalHotelTenant();
  const { logoUrl: logoFromHook, appName, hotelName } = useHotelDisplay();
  const slug = tenant?.slug ?? "";
  const logoUrl = logoUrlProp ?? logoFromHook;
  const alt = altProp ?? appName;
  const name = hotelName || appName;
  const sizeClass = SIZE[variant];
  const hasLogo = Boolean(logoUrl && getHotelLogoSrc(slug, logoUrl));

  if (hasLogo && slug) {
    return (
      <span
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-xl",
          sizeClass,
          framed || variant === "header"
            ? "border border-zinc-100/90 bg-white shadow-sm ring-1 ring-zinc-100/60"
            : variant === "drawer"
              ? "border border-white/15 bg-white"
              : "bg-white ring-1 ring-zinc-100/80",
          className,
        )}
      >
        <HotelLogoImage slug={slug} name={name} logoUrl={logoUrl} className="h-full w-full" />
      </span>
    );
  }

  if (framed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-white shadow-sm",
          sizeClass,
          className,
        )}
      >
        <GuestProLogo variant="header" className="h-4 w-4" />
      </span>
    );
  }

  if (variant === "drawer") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-white/10",
          sizeClass,
          className,
        )}
      >
        <GuestProLogo variant="header" className="h-4 w-4 brightness-0 invert" />
      </span>
    );
  }

  return <GuestProLogo variant="header" className={className} />;
}
