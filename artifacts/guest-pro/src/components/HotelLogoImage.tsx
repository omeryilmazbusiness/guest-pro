import { useState } from "react";
import { Building2 } from "lucide-react";
import { getHotelLogoSrc } from "@/lib/hotel-logo";
import { cn } from "@/lib/utils";

interface HotelLogoImageProps {
  slug?: string;
  name: string;
  logoUrl?: string | null;
  cacheKey?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
}

/**
 * Hotel logo with slug-based URL fallback and graceful error handling.
 */
export function HotelLogoImage({
  slug,
  name,
  logoUrl,
  cacheKey,
  className,
  imgClassName,
  fallbackClassName,
}: HotelLogoImageProps) {
  const [failed, setFailed] = useState(false);
  const src = getHotelLogoSrc(slug ?? "", logoUrl, cacheKey);
  const letter = (name.trim()[0] ?? "H").toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 font-semibold text-white",
          fallbackClassName,
        )}
      >
        {name.trim() ? letter : <Building2 className="h-1/2 w-1/2 opacity-90" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn("h-full w-full object-cover", imgClassName)}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
