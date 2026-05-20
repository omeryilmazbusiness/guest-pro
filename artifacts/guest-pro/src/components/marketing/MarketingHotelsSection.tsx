import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";
import { RequestDemoDialog } from "@/components/marketing/RequestDemoDialog";
import { Button } from "@/components/ui/button";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { HOTEL_PILLAR_ICONS, HOTEL_STORY_ICONS } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

interface MarketingHotelsSectionProps {
  onScrollToDemo?: () => void;
}

export function MarketingHotelsSection({ onScrollToDemo }: MarketingHotelsSectionProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();
  const h = t.hotels;

  return (
    <section
      id="for-hotels"
      className="marketing-hotels marketing-section relative border-t border-white/10 bg-black"
    >
      <div className="marketing-landing__orb marketing-landing__orb--a opacity-30" aria-hidden="true" />
      <div className="marketing-landing__orb marketing-landing__orb--b opacity-20" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          className="marketing-hotels__hero marketing-landing__card mb-16 rounded-3xl border border-white/12 p-8 sm:p-12"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-4">{h.label}</p>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {h.tiers.map((tier) => (
              <span
                key={tier}
                className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-200/90"
              >
                {tier}
              </span>
            ))}
          </div>
          <h2 className="marketing-hotels__title flex items-start gap-3 text-balance">
            <Rocket
              className="marketing-hotels__title-icon mt-1 h-8 w-8 shrink-0 text-amber-300/80 sm:h-10 sm:w-10"
              aria-hidden="true"
            />
            <span>{h.title}</span>
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">{h.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <RequestDemoDialog
              trigger={
                <Button
                  size="lg"
                  className="marketing-landing__btn-primary marketing-btn-mobile gap-2 rounded-full px-8"
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {h.bookDemo}
                </Button>
              }
            />
            {onScrollToDemo && (
              <Button
                size="lg"
                variant="outline"
                className="marketing-landing__btn-ghost marketing-btn-mobile rounded-full border-white/20 px-8"
                onClick={onScrollToDemo}
              >
                {h.roiWalkthrough}
                <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-2">{h.roiLabel}</p>
          <h3 className="marketing-landing__section-title text-balance">{h.roiTitle}</h3>
        </motion.div>

        <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {h.roi.map((metric, index) => (
            <motion.li
              key={metric.label}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: index * 0.05, duration: 0.8, ease: HEAVY_EASE }}
              className="marketing-hotels__metric marketing-landing__card rounded-2xl border border-white/10 p-5"
            >
              <p className="marketing-hotels__metric-value">
                {metric.value}
                {metric.suffix && (
                  <span className="marketing-hotels__metric-suffix">{metric.suffix}</span>
                )}
              </p>
              <p className="mt-2 text-sm font-medium text-white/90">{metric.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{metric.detail}</p>
              <p className="marketing-hotels__metric-figure mt-3 text-[11px] font-medium uppercase tracking-wider text-emerald-300/80">
                {metric.figure}
              </p>
            </motion.li>
          ))}
        </ul>

        <p className="mb-16 text-center text-[11px] leading-relaxed text-white/35 sm:text-xs">
          {h.disclaimer}
        </p>

        <ul className="mb-16 grid gap-4 md:grid-cols-3">
          {h.pillars.map(({ title, description }, index) => {
            const Icon = HOTEL_PILLAR_ICONS[index]!;
            return (
              <motion.li
                key={title}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.75, ease: HEAVY_EASE }}
                className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="h-5 w-5 text-amber-200/80" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          className="mb-10 text-center"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: HEAVY_EASE }}
        >
          <p className="marketing-landing__label mb-3">{h.storiesLabel}</p>
          <h3 className="marketing-landing__section-title text-balance">{h.storiesTitle}</h3>
        </motion.div>

        <ul className="space-y-8">
          {h.stories.map((story, index) => {
            const Icon = HOTEL_STORY_ICONS[index]!;
            return (
              <motion.li
                key={story.tag}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.06, duration: 0.9, ease: HEAVY_EASE }}
                className={cn(
                  "marketing-hotels__story marketing-landing__card overflow-hidden rounded-2xl border border-white/10",
                  index % 2 === 1 && "lg:flex-row-reverse",
                  "lg:flex lg:gap-0",
                )}
              >
                <div className="marketing-hotels__story-visual flex flex-col justify-between border-b border-white/10 p-6 lg:w-[38%] lg:border-b-0 lg:border-e lg:border-white/10">
                  <div>
                    <span className="marketing-hotels__story-tag">{story.tag}</span>
                    <div className="marketing-hotels__story-icon-wrap mt-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-amber-500/15 to-transparent">
                      <Icon className="h-8 w-8 text-white/90" aria-hidden="true" />
                    </div>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {story.metrics.map((m) => (
                      <li
                        key={m.label}
                        className="flex items-baseline justify-between gap-3 border-t border-white/8 pt-3 first:border-t-0 first:pt-0"
                      >
                        <span className="text-[11px] uppercase tracking-wider text-white/45">{m.label}</span>
                        <span className="text-sm font-medium text-amber-100/95">{m.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 sm:p-8 lg:flex-1">
                  <h4 className="text-xl font-medium tracking-tight text-white sm:text-2xl">{story.title}</h4>
                  <p className="mt-3 text-sm font-medium text-amber-200/75">{story.hook}</p>
                  <div className="mt-5 space-y-4">
                    {story.story.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 48)}
                        className="text-sm leading-relaxed text-white/58 sm:text-[15px]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <p className="marketing-hotels__story-outcome mt-6 border-t border-white/10 pt-5 text-sm text-emerald-200/90">
                    {story.outcome}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
