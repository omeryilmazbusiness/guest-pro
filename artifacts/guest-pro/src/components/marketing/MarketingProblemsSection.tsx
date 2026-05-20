import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { PROBLEM_ICONS } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

export function MarketingProblemsSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();

  return (
    <section
      id="challenges"
      className="marketing-section relative border-t border-white/10 bg-black"
    >
      <div className="marketing-landing__orb marketing-landing__orb--a opacity-20" aria-hidden="true" />
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-14 max-w-3xl"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-3">{t.challenges.label}</p>
          <h2 className="marketing-landing__section-title text-balance">{t.challenges.title}</h2>
          <p className="mt-5 text-sm leading-relaxed text-white/55 sm:text-base">{t.challenges.intro}</p>
        </motion.div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.challenges.items.map(({ title, description }, index) => {
            const Icon = PROBLEM_ICONS[index]!;
            return (
              <motion.li
                key={title}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.07, duration: 0.85, ease: HEAVY_EASE }}
                className={cn(
                  "marketing-landing__card marketing-landing__problem-card",
                  "relative overflow-hidden rounded-2xl border border-white/10 p-6",
                )}
              >
                <div
                  className="marketing-landing__problem-figure pointer-events-none absolute -end-4 -top-4 h-24 w-24 rounded-full border border-red-500/10 bg-red-500/5"
                  aria-hidden="true"
                />
                <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10">
                  <Icon className="h-5 w-5 text-red-300/90" aria-hidden="true" />
                </div>
                <h3 className="relative mb-2 flex items-start gap-2 text-lg font-medium text-white">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" aria-hidden="true" />
                  {title}
                </h3>
                <p className="relative text-sm leading-relaxed text-white/55">{description}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
