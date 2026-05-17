/**
 * RegisterQrLabelCycle — Manrope multi-language registration hint with premium fade.
 */

import { useEffect, useState } from "react";
import { WELCOMING_LANGUAGES } from "@/lib/welcoming/languages";
import { getWelcomingStrings } from "@/lib/welcoming/hotel-content";
import { cn } from "@/lib/utils";

const CYCLE_MS = 3_400;

export function RegisterQrLabelCycle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % WELCOMING_LANGUAGES.length);
    }, CYCLE_MS);
    return () => window.clearInterval(t);
  }, []);

  const lang = WELCOMING_LANGUAGES[index];
  const label = getWelcomingStrings(lang.uiLocale).registerQrLabel;

  return (
    <div
      className="relative w-full min-h-[6rem] sm:min-h-[6.75rem] flex items-center justify-center overflow-hidden px-5"
      aria-live="polite"
      aria-label="registration instruction"
    >
      <p
        key={`reg-${index}`}
        dir={lang.dir}
        lang={lang.uiLocale}
        className={cn(
          "welcoming-kiosk-label absolute text-center max-w-lg",
          "welcoming-register-label-enter",
        )}
      >
        {label}
      </p>
    </div>
  );
}
