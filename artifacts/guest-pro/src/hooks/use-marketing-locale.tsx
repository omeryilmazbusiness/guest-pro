import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMarketingTranslations,
  marketingDir,
  persistMarketingLocale,
  readStoredMarketingLocale,
  type MarketingLocale,
  type MarketingTranslations,
} from "@/lib/marketing/i18n";

interface MarketingLocaleContextValue {
  locale: MarketingLocale;
  dir: "ltr" | "rtl";
  t: MarketingTranslations;
  setLocale: (locale: MarketingLocale) => void;
}

const MarketingLocaleContext = createContext<MarketingLocaleContextValue | null>(null);

export function MarketingLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<MarketingLocale>(readStoredMarketingLocale);

  const setLocale = useCallback((next: MarketingLocale) => {
    setLocaleState(next);
    persistMarketingLocale(next);
  }, []);

  const dir = marketingDir(locale);
  const t = useMemo(() => getMarketingTranslations(locale), [locale]);

  useEffect(() => {
    const root = document.documentElement;
    const prevDir = root.dir;
    const prevLang = root.lang;
    root.dir = dir;
    root.lang = locale;
    return () => {
      root.dir = prevDir || "ltr";
      root.lang = prevLang || "en";
    };
  }, [dir, locale]);

  const value = useMemo(
    () => ({ locale, dir, t, setLocale }),
    [locale, dir, t, setLocale],
  );

  return (
    <MarketingLocaleContext.Provider value={value}>{children}</MarketingLocaleContext.Provider>
  );
}

export function useMarketingLocale(): MarketingLocaleContextValue {
  const ctx = useContext(MarketingLocaleContext);
  if (!ctx) {
    throw new Error("useMarketingLocale must be used within MarketingLocaleProvider");
  }
  return ctx;
}
