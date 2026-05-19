import { cn } from "@/lib/utils";
import { NEARBY_TYPE_META, type NearbyPlaceType } from "@/lib/welcoming/nearby-place-meta";

interface NearbyPlaceTypeIconProps {
  type: NearbyPlaceType;
  size?: "sm" | "md";
  className?: string;
}

export function NearbyPlaceTypeIcon({ type, size = "md", className }: NearbyPlaceTypeIconProps) {
  const meta = NEARBY_TYPE_META[type] ?? NEARBY_TYPE_META.other;
  const Icon = meta.icon;
  const dim = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const iconDim = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";

  return (
    <span
      className={cn(
        "rounded-xl border flex items-center justify-center shrink-0",
        dim,
        meta.iconWrap,
        className,
      )}
    >
      <Icon className={cn(iconDim, meta.iconColor)} strokeWidth={1.75} />
    </span>
  );
}
