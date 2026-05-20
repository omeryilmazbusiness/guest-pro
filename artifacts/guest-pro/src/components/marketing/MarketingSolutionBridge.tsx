import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { SOLUTION_ICONS } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";

export function MarketingSolutionBridge() {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();

  return (
    <section className="marketing-section relative border-t border-white/10 bg-black py-16 md:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-3">{t.solution.label}</p>
          <h2 className="marketing-landing__section-title text-balance">{t.solution.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            {t.solution.intro}
          </p>
          <ArrowDown className="mx-auto mt-8 h-5 w-5 text-white/30" aria-hidden="true" />
        </motion.div>
      </div>

      <ul className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {t.solution.beats.map(({ problem, solution }, index) => {
          const Icon = SOLUTION_ICONS[index]!;
          return (
            <motion.li
              key={problem}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1, duration: 0.9, ease: HEAVY_EASE }}
              className="marketing-landing__card marketing-landing__solution-card rounded-2xl border border-emerald-500/15 p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10">
                <Icon className="h-6 w-6 text-emerald-300/90" aria-hidden="true" />
              </div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-red-300/80">
                {t.solution.problemLabel}
              </p>
              <p className="mb-4 text-sm leading-relaxed text-white/60">{problem}</p>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-300/80">
                {t.solution.guestProLabel}
              </p>
              <p className="text-sm leading-relaxed text-white/85">{solution}</p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
