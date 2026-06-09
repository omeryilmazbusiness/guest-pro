import {
  ShoppingBasket,
  Pill,
  Store,
  UtensilsCrossed,
  MapPin,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import type { NearbyPlace } from "./types";
import type { WelcomingStrings } from "./hotel-content";

export type NearbyPlaceType = NearbyPlace["type"];

export type NearbyTypeLabelKey =
  | "placeTypeMarket"
  | "placeTypePharmacy"
  | "placeTypeBazaar"
  | "placeTypeMall"
  | "placeTypeRestaurant"
  | "placeTypeOther";

export const NEARBY_TYPE_ORDER: NearbyPlaceType[] = [
  "market",
  "pharmacy",
  "bazaar",
  "mall",
  "restaurant",
  "other",
];

export const NEARBY_TYPE_META: Record<
  NearbyPlaceType,
  {
    icon: LucideIcon;
    labelKey: NearbyTypeLabelKey;
    iconWrap: string;
    iconColor: string;
    chipActive: string;
    chipIdle: string;
  }
> = {
  market: {
    icon: ShoppingBasket,
    labelKey: "placeTypeMarket",
    iconWrap: "bg-teal-50 border-teal-100",
    iconColor: "text-teal-600",
    chipActive: "bg-teal-600 text-white border-teal-600",
    chipIdle: "bg-white text-teal-700 border-teal-100",
  },
  pharmacy: {
    icon: Pill,
    labelKey: "placeTypePharmacy",
    iconWrap: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-600",
    chipActive: "bg-rose-600 text-white border-rose-600",
    chipIdle: "bg-white text-rose-700 border-rose-100",
  },
  bazaar: {
    icon: Store,
    labelKey: "placeTypeBazaar",
    iconWrap: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-700",
    chipActive: "bg-amber-600 text-white border-amber-600",
    chipIdle: "bg-white text-amber-800 border-amber-100",
  },
  mall: {
    icon: ShoppingBag,
    labelKey: "placeTypeMall",
    iconWrap: "bg-violet-50 border-violet-100",
    iconColor: "text-violet-600",
    chipActive: "bg-violet-600 text-white border-violet-600",
    chipIdle: "bg-white text-violet-700 border-violet-100",
  },
  restaurant: {
    icon: UtensilsCrossed,
    labelKey: "placeTypeRestaurant",
    iconWrap: "bg-orange-50 border-orange-100",
    iconColor: "text-orange-600",
    chipActive: "bg-orange-600 text-white border-orange-600",
    chipIdle: "bg-white text-orange-700 border-orange-100",
  },
  other: {
    icon: MapPin,
    labelKey: "placeTypeOther",
    iconWrap: "bg-zinc-50 border-zinc-100",
    iconColor: "text-zinc-600",
    chipActive: "bg-zinc-800 text-white border-zinc-800",
    chipIdle: "bg-white text-zinc-600 border-zinc-200",
  },
};

export function getNearbyTypeLabel(s: WelcomingStrings, type: NearbyPlaceType): string {
  return s[NEARBY_TYPE_META[type].labelKey];
}
