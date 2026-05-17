/**
 * PremiumTypewriter — slow character reveal with luxury 3D italic typography.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CHAR_MS = 58;
const HOLD_AFTER_MS = 2_200;

interface PremiumTypewriterProps {
  text: string;
  dir: "ltr" | "rtl";
  lang: string;
  locale: string;
  onCycleComplete?: () => void;
  className?: string;
}

export function PremiumTypewriter({
  text,
  dir,
  lang,
  locale,
  onCycleComplete,
  className,
}: PremiumTypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setExiting(false);
    setEntered(false);
    setDisplayed("");

    const enterT = window.setTimeout(() => setEntered(true), 40);

    let charIndex = 0;
    const typeInterval = window.setInterval(() => {
      charIndex += 1;
      setDisplayed(text.slice(0, charIndex));
      if (charIndex >= text.length) {
        window.clearInterval(typeInterval);
      }
    }, CHAR_MS);

    const holdMs = text.length * CHAR_MS + HOLD_AFTER_MS;
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
      onCycleComplete?.();
    }, holdMs);

    return () => {
      window.clearTimeout(enterT);
      window.clearInterval(typeInterval);
      window.clearTimeout(exitTimer);
    };
  }, [text, onCycleComplete]);

  const isArabic = locale === "ar" || locale === "ur";

  return (
    <h1
      dir={dir}
      lang={lang}
      className={cn(
        "passport-luxury-headline text-center text-[2.35rem] sm:text-[2.85rem] md:text-[3.25rem] px-4",
        isArabic && "passport-luxury-headline--ar",
        entered && !exiting && "passport-luxury-enter",
        exiting && "passport-luxury-exit",
        className,
      )}
    >
      {displayed}
      {!exiting && displayed.length < text.length && (
        <span className="passport-typewriter-caret" aria-hidden="true" />
      )}
    </h1>
  );
}
