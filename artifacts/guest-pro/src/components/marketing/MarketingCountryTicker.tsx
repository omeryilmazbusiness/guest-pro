import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { MARKETING_COUNTRY_CODES } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

const HOLD_MS = 3200;
const TRANSITION_S = 1.15;

interface MarketingCountryTickerProps {
  className?: string;
}

function CountryRow({ name, code }: { name: string; code: string }) {
  return (
    <span className="marketing-hero__country-ticker">
      <CountryFlag code={code} size="md" className="marketing-hero__country-flag-icon" />
      <span className="marketing-hero__country-name">{name}</span>
    </span>
  );
}

export function MarketingCountryTicker({ className }: MarketingCountryTickerProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();
  const [index, setIndex] = useState(0);

  const name = t.countries[index] ?? t.countries[0]!;
  const code = MARKETING_COUNTRY_CODES[index] ?? MARKETING_COUNTRY_CODES[0];

  useEffect(() => {
    setIndex(0);
  }, [t]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % t.countries.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, t.countries.length]);

  if (reduceMotion) {
    return (
      <div className={cn("marketing-hero__country-ticker-wrap", className)}>
        <CountryRow name={t.countries[0]!} code={MARKETING_COUNTRY_CODES[0]} />
      </div>
    );
  }

  return (
    <div className={cn("marketing-hero__country-ticker-wrap", className)} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={name}
          className="marketing-hero__country-ticker-slide"
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ duration: TRANSITION_S, ease: HEAVY_EASE }}
        >
          <CountryRow name={name} code={code} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
