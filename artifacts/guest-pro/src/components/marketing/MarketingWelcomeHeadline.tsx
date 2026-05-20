import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

const CHAR_MS = 68;
const HOLD_MS = 2600;
const SLIDE_S = 0.95;

interface MarketingWelcomeHeadlineProps {
  className?: string;
}

export function MarketingWelcomeHeadline({ className }: MarketingWelcomeHeadlineProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();
  const phrases = t.welcomePhrases;

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  const phrase = phrases[phraseIndex] ?? phrases[0]!;
  const fullText = phrase.text;

  useEffect(() => {
    setPhraseIndex(0);
    setVisibleChars(0);
  }, [t]);

  useEffect(() => {
    setVisibleChars(0);
  }, [phraseIndex]);

  useEffect(() => {
    if (reduceMotion) return;

    if (visibleChars < fullText.length) {
      const id = window.setTimeout(() => setVisibleChars((n) => n + 1), CHAR_MS);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [visibleChars, fullText.length, reduceMotion, phraseIndex, phrases.length]);

  if (reduceMotion) {
    return (
      <h1
        className={cn(
          "marketing-landing__headline marketing-hero__welcome-headline w-full max-w-none text-balance",
          className,
        )}
        dir={phrases[0]?.dir}
      >
        {phrases[0]?.text}
      </h1>
    );
  }

  const typed = fullText.slice(0, visibleChars);
  const isTyping = visibleChars < fullText.length;

  return (
    <h1
      className={cn(
        "marketing-landing__headline marketing-hero__welcome-headline w-full max-w-none text-balance",
        className,
      )}
      dir={phrase.dir}
    >
      <span className="marketing-hero__welcome-headline-inner">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${phraseIndex}-${fullText}`}
            className="marketing-hero__welcome-phrase"
            initial={{ y: -28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: SLIDE_S, ease: HEAVY_EASE }}
          >
            <span className="marketing-hero__welcome-text">{typed}</span>
            <span
              className={cn(
                "marketing-hero__welcome-caret",
                isTyping && "marketing-hero__welcome-caret--active",
              )}
              aria-hidden="true"
            />
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="sr-only" aria-live="polite">
        {fullText}
      </span>
    </h1>
  );
}
