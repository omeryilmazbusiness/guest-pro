import { cn } from "@/lib/utils";
import { HotelLogoImage } from "@/components/HotelLogoImage";

const SIZES = {
  sm: "h-12 w-12 rounded-xl text-sm",
  md: "h-16 w-16 rounded-2xl text-lg",
  lg: "h-20 w-20 rounded-2xl text-xl",
} as const;

export function HotelCardAvatar({
  name,
  slug,
  logoUrl,
  cacheKey,
  size = "md",
  className,
}: {
  name: string;
  slug?: string;
  logoUrl?: string | null;
  cacheKey?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const sizeClass = SIZES[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-white ring-1 ring-zinc-200/80 shadow-sm",
        sizeClass,
        className,
      )}
    >
      <HotelLogoImage
        slug={slug}
        name={name}
        logoUrl={logoUrl}
        cacheKey={cacheKey}
        className="h-full w-full"
      />
    </div>
  );
}
