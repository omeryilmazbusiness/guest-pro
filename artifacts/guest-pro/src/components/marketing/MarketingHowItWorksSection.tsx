import { motion, useReducedMotion } from "framer-motion";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { HOW_STEP_ICONS } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

const STEPS = ["01", "02", "03"] as const;

export function MarketingHowItWorksSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();

  return (
    <section
      id="how-it-works"
      className="marketing-section relative border-t border-white/10 bg-black"
    >
      <div className="marketing-landing__orb marketing-landing__orb--b opacity-25" aria-hidden="true" />
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-16 text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-3">{t.howItWorks.label}</p>
          <h2 className="marketing-landing__section-title text-balance">{t.howItWorks.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/50 sm:text-base">{t.howItWorks.intro}</p>
        </motion.div>

        <ol className="relative space-y-10">
          <div
            className="marketing-landing__timeline-line pointer-events-none absolute bottom-8 start-6 top-8 hidden w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent md:block"
            aria-hidden="true"
          />
          {t.howItWorks.items.map(({ title, problem, narrative, outcome }, index) => {
            const Icon = HOW_STEP_ICONS[index]!;
            return (
              <motion.li
                key={title}
                initial={reduceMotion ? false : { opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.95, ease: HEAVY_EASE }}
                className={cn(
                  "marketing-landing__card marketing-landing__how-card",
                  "relative rounded-2xl border border-white/10 p-6 sm:p-8 md:ps-14",
                )}
              >
                <span className="marketing-landing__step-num">{STEPS[index]}</span>
                <div className="marketing-landing__how-figure mb-6 flex items-center gap-4" aria-hidden="true">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                    <Icon className="h-7 w-7 text-white/90" />
                  </div>
                  <div className="hidden h-px flex-1 bg-gradient-to-r from-white/20 to-transparent sm:block" />
                </div>
                <h3 className="mb-4 text-xl font-medium tracking-tight text-white sm:text-2xl">{title}</h3>
                <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr] sm:gap-6">
                  <div className="rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-red-300/75">
                      {t.howItWorks.problemLabel}
                    </p>
                    <p className="text-sm leading-relaxed text-white/65">{problem}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
                      {t.howItWorks.happensLabel}
                    </p>
                    <p className="text-sm leading-relaxed text-white/75 sm:text-base">{narrative}</p>
                  </div>
                </div>
                <p className="mt-5 border-t border-white/10 pt-5 text-sm font-medium text-emerald-200/90">
                  → {outcome}
                </p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
