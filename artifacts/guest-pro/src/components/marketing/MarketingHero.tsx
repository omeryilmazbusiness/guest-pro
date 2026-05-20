import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { MarketingCountryTicker } from "@/components/marketing/MarketingCountryTicker";
import { MarketingWelcomeHeadline } from "@/components/marketing/MarketingWelcomeHeadline";
import { MarketingHeroPhones } from "@/components/marketing/MarketingHeroPhones";
import { RequestDemoDialog } from "@/components/marketing/RequestDemoDialog";
import { SparklesCore } from "@/components/ui/sparkles";
import { Button } from "@/components/ui/button";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { HERO_STATS, HERO_VALUE_PILLS } from "@/lib/marketing/content";
import { HEAVY_EASE, SLOW_ENTER, SLOW_STAGGER } from "@/lib/marketing/motion";
interface MarketingHeroProps {
  onScrollTo: (id: string) => void;
}

export function MarketingHero({ onScrollTo }: MarketingHeroProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useMarketingLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 1.05, ease: HEAVY_EASE },
        };

  return (
    <section id="hero" className="marketing-hero relative overflow-hidden lg:min-h-[calc(100svh-4.25rem)]">
      <div
        className="marketing-hero__bg pointer-events-none absolute inset-0 size-full min-h-full bg-black"
        aria-hidden="true"
      >
        {!reduceMotion && (
          <SparklesCore
            id="guest-pro-hero-sparkles"
            background="transparent"
            minSize={0.6}
            maxSize={isMobile ? 1.1 : 1.4}
            particleDensity={isMobile ? 55 : 100}
            particleColor="#FFFFFF"
            speed={1}
            className="absolute inset-0 size-full"
          />
        )}
        <div className="marketing-hero__sparkles-vignette absolute inset-0" />
        <div className="marketing-hero__sparkles-gradient absolute inset-0" />
      </div>

      <div className="marketing-hero__grid relative z-10 mx-auto w-full max-w-7xl lg:grid lg:items-start lg:grid-cols-[minmax(0,1.12fr)_auto] lg:gap-10 lg:pb-14 lg:pt-11 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:gap-12">
        <div className="marketing-hero__copy flex min-w-0 flex-col items-center text-center lg:items-start lg:text-start">
          <motion.div
            {...fade(0.08)}
            className="marketing-landing__badge mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/75 sm:mb-6 sm:px-4 sm:text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate sm:whitespace-normal">{t.hero.badge}</span>
          </motion.div>

          <motion.div {...fade(0.08 + SLOW_STAGGER)} className="w-full">
            <MarketingWelcomeHeadline />
          </motion.div>

          <motion.p
            {...fade(0.08 + SLOW_STAGGER * 2)}
            className="marketing-landing__tagline mt-4 w-full max-w-2xl text-balance sm:mt-5 lg:max-w-xl xl:max-w-2xl"
          >
            <span className="marketing-landing__shimmer">{t.hero.taglineBrand}</span> {t.hero.tagline}
          </motion.p>

          <motion.ul
            {...fade(0.08 + SLOW_STAGGER * 3)}
            className="marketing-hero__pills mt-6 lg:mt-7 lg:flex lg:flex-wrap lg:justify-start lg:overflow-visible lg:mask-none"
          >
            {HERO_VALUE_PILLS.map(({ icon: Icon, key }) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 backdrop-blur-md sm:text-sm"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden="true" />
                {t.hero[key]}
              </li>
            ))}
          </motion.ul>

          <motion.div
            {...fade(0.08 + SLOW_STAGGER * 4)}
            className="marketing-hero__actions mt-7 flex w-full max-w-md flex-col gap-3 lg:mt-9 lg:max-w-none lg:flex-row lg:items-center"
          >
            <RequestDemoDialog
              trigger={
                <Button
                  size="lg"
                  className="marketing-btn-mobile gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-6 text-base text-white backdrop-blur-md hover:bg-white/15"
                >
                  <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.hero.requestDemo}
                </Button>
              }
            />
            <Button
              size="lg"
              className="marketing-landing__btn-primary marketing-btn-mobile gap-2 rounded-full px-8 py-6 text-base"
              onClick={() => onScrollTo("how-it-works")}
            >
              {t.hero.seeHowItWorks}
              <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </motion.div>

          <motion.dl
            {...fade(0.08 + SLOW_STAGGER * 5)}
            className="marketing-hero__stats mt-8 w-full border-t border-white/10 pt-7 sm:mt-10 sm:pt-8"
          >
            {HERO_STATS.map(({ value, key }) => (
              <div key={key} className="marketing-hero__stat">
                <dt className="sr-only">{t.hero[key]}</dt>
                <dd className="marketing-hero__stat-value-row">
                  {value === "country" ? (
                    <MarketingCountryTicker />
                  ) : (
                    <span className="marketing-landing__stat-value">{value}</span>
                  )}
                </dd>
                <dd className="marketing-hero__stat-label">{t.hero[key]}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          className="marketing-hero__phone-wrap flex shrink-0 justify-center lg:justify-end"
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SLOW_ENTER, delay: 0.35 }}
        >
          <MarketingHeroPhones />
        </motion.div>
      </div>
    </section>
  );
}
