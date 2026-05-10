/**
 * useStaffLocale
 *
 * Reactive locale hook for Manager · Personnel · Restaurant dashboards.
 *
 * - Reads the preferred locale from localStorage key "staff_locale"
 * - Falls back to browser navigator.language → "en"
 * - Writes changes back to localStorage + fires a custom "staff-locale-change"
 *   event so all open tabs/components update simultaneously (no prop-drilling).
 * - Sets document.dir + document.lang for proper RTL support (Arabic).
 */

import { useState, useEffect, useCallback } from "react";
import {
  getStaffTranslations,
  type StaffLocale,
  type StaffTranslations,
} from "@/lib/staff-i18n";

const LS_KEY = "staff_locale";
const CUSTOM_EVENT = "staff-locale-change";
const SUPPORTED: StaffLocale[] = ["en", "tr", "ar"];

function resolveBrowserLocale(): StaffLocale {
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("ar")) return "ar";
  return "en";
}

function readLocale(): StaffLocale {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && SUPPORTED.includes(stored as StaffLocale)) {
      return stored as StaffLocale;
    }
  } catch {
    // SSR or restricted environment
  }
  return resolveBrowserLocale();
}

function applyToDocument(locale: StaffLocale) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;
}

export interface StaffLocaleContext {
  locale: StaffLocale;
  t: StaffTranslations;
  dir: "ltr" | "rtl";
  setLocale: (locale: StaffLocale) => void;
}

export function useStaffLocale(): StaffLocaleContext {
  const [locale, setLocaleState] = useState<StaffLocale>(readLocale);

  const setLocale = useCallback((next: StaffLocale) => {
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      // ignore
    }
    // Notify other components / tabs
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT, { detail: next }));
    setLocaleState(next);
    applyToDocument(next);
  }, []);

  // Sync when another tab or component changes the locale
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue && SUPPORTED.includes(e.newValue as StaffLocale)) {
        const next = e.newValue as StaffLocale;
        setLocaleState(next);
        applyToDocument(next);
      }
    };
    const onCustom = (e: Event) => {
      const next = (e as CustomEvent<StaffLocale>).detail;
      if (SUPPORTED.includes(next)) {
        setLocaleState(next);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CUSTOM_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CUSTOM_EVENT, onCustom);
    };
  }, []);

  // Apply on mount
  useEffect(() => {
    applyToDocument(locale);
    return () => {
      // Restore defaults when staff pages unmount (guest pages handle their own dir)
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    };
  }, [locale]);

  return {
    locale,
    t: getStaffTranslations(locale),
    dir: locale === "ar" ? "rtl" : "ltr",
    setLocale,
  };
}
