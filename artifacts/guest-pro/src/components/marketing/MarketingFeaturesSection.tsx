import { motion, useReducedMotion } from "framer-motion";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { FEATURE_ICONS } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

export function MarketingFeaturesSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();

  return (
    <section id="features" className="marketing-section relative border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 text-center"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-3">{t.features.label}</p>
          <h2 className="marketing-landing__section-title text-balance">{t.features.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/50 sm:text-base">{t.features.intro}</p>
        </motion.div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map(({ title, description, highlight }, index) => {
            const Icon = FEATURE_ICONS[index]!;
            return (
              <motion.li
                key={title}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.06, duration: 0.8, ease: HEAVY_EASE }}
                whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.45 } }}
                className={cn(
                  "marketing-landing__card marketing-landing__feature-card",
                  "relative overflow-hidden rounded-2xl border border-white/10 p-6",
                  "transition-[border-color] hover:border-white/25",
                )}
              >
                <div
                  className="marketing-landing__feature-figure pointer-events-none absolute -bottom-6 -end-6 h-28 w-28 rounded-full border border-white/5 bg-white/[0.02]"
                  aria-hidden="true"
                />
                <span className="relative mb-3 inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
                  {highlight}
                </span>
                <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="h-5 w-5 text-white/90" aria-hidden="true" />
                </div>
                <h3 className="relative mb-2 text-lg font-medium tracking-tight text-white">{title}</h3>
                <p className="relative text-sm leading-relaxed text-white/55">{description}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
