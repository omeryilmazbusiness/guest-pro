import type { GuestTranslations } from "../types";
import { en } from "./en";
import { tr } from "./tr";
import { ar } from "./ar";
import { ru } from "./ru";
import { de } from "./de";
import { fr } from "./fr";
import { es } from "./es";
import { it } from "./it";
import { ur } from "./ur";
import { fa } from "./fa";
import { he } from "./he";
import { ku } from "./ku";

export type SupportedLocale =
  | "en"
  | "tr"
  | "ar"
  | "ru"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "ur"
  | "fa"
  | "he"
  | "ku";

export const translations: Record<SupportedLocale, GuestTranslations> = {
  en,
  tr,
  ar,
  ru,
  de,
  fr,
  es,
  it,
  ur,
  fa,
  he,
  ku,
};
