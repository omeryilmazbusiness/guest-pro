/**
 * GreetingLoop — animated "Hello" in each of the 6 welcoming languages.
 *
 * Uses a CSS keyframe (greeting-slide, defined in index.css) that encodes
 * the full enter → hold → exit sequence in one animation pass.
 * React simply cycles the index every CYCLE_MS milliseconds.
 * Remounting with key={index} restarts the animation for each new greeting.
 */

import { useEffect, useState } from "react";
import { WELCOMING_LANGUAGES } from "@/lib/welcoming/languages";

const CYCLE_MS = 2800;

export function GreetingLoop() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % WELCOMING_LANGUAGES.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const current = WELCOMING_LANGUAGES[index];

  return (
    <div className="flex flex-col items-center gap-3 select-none" aria-live="polite" aria-label="greeting">
      {/* Greeting word */}
      <div className="relative h-20 w-full flex items-center justify-center overflow-hidden">
        <span
          key={`greeting-${index}`}
          dir={current.dir}
          lang={current.uiLocale}
          className="absolute text-6xl md:text-7xl font-light tracking-tight text-white"
          style={{ animation: `greeting-slide ${CYCLE_MS}ms ease-in-out forwards` }}
        >
          {current.greeting}
        </span>
      </div>

      {/* Language label — subtle, fades with the greeting */}
      <div className="relative h-5 w-full flex items-center justify-center overflow-hidden">
        <span
          key={`label-${index}`}
          dir={current.dir}
          className="absolute text-[11px] font-medium tracking-widest uppercase text-zinc-500"
          style={{ animation: `greeting-slide ${CYCLE_MS}ms ease-in-out forwards` }}
        >
          {current.label}
        </span>
      </div>
    </div>
  );
}
