import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { CalendarClock } from "lucide-react";
import { MarketingFeaturesSection } from "@/components/marketing/MarketingFeaturesSection";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { MarketingHotelsSection } from "@/components/marketing/MarketingHotelsSection";
import { MarketingHowItWorksSection } from "@/components/marketing/MarketingHowItWorksSection";
import { MarketingProblemsSection } from "@/components/marketing/MarketingProblemsSection";
import { MarketingSolutionBridge } from "@/components/marketing/MarketingSolutionBridge";
import { RequestDemoDialog } from "@/components/marketing/RequestDemoDialog";
import { Button } from "@/components/ui/button";
import { MarketingLocaleProvider, useMarketingLocale } from "@/hooks/use-marketing-locale";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/app-routes";
import { HEAVY_EASE } from "@/lib/marketing/motion";

function DemoButton({ className }: { className?: string }) {
  const { t } = useMarketingLocale();
  return (
    <RequestDemoDialog
      trigger={
        <Button
          size="lg"
          className={cn(
            "gap-2 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/15",
            className,
          )}
        >
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          {t.demo.requestDemo}
        </Button>
      }
    />
  );
}

function MarketingHomeContent() {
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const { t, dir } = useMarketingLocale();

  const scrollTo = (href: string) => {
    const id = href.startsWith("#") ? href.slice(1) : href;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="marketing-landing relative min-h-svh min-h-dvh overflow-x-hidden bg-black text-white"
      dir={dir}
    >
      <MarketingHeader onNavigate={scrollTo} />

      <main className="relative z-10">
        <MarketingHero onScrollTo={scrollTo} />

        <MarketingProblemsSection />
        <MarketingSolutionBridge />
        <MarketingHowItWorksSection />
        <MarketingFeaturesSection />

        <MarketingHotelsSection onScrollToDemo={() => scrollTo("#demo")} />

        <section id="demo" className="marketing-section relative mb-12 pt-0 md:mb-16">
          <motion.div
            className="marketing-landing__cta mx-auto max-w-4xl rounded-2xl border border-white/15 px-5 py-10 text-center sm:rounded-3xl sm:px-14 sm:py-14"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: HEAVY_EASE }}
          >
            <p className="marketing-landing__label mb-4">{t.demo.label}</p>
            <h2 className="marketing-landing__section-title mb-4 text-balance">{t.demo.title}</h2>
            <p className="mx-auto mb-8 max-w-lg text-sm text-white/55 sm:text-base">{t.demo.intro}</p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DemoButton className="marketing-btn-mobile px-10 py-6 text-base" />
              <Button
                size="lg"
                variant="outline"
                className="marketing-landing__btn-ghost marketing-btn-mobile rounded-full border-white/25 px-8"
                onClick={() => setLocation(ROUTES.login)}
              >
                {t.demo.guestSignIn}
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="marketing-section border-t border-white/10 py-10 text-center md:py-12">
          <p className="text-sm text-white/45">
            {t.footer.kioskPrompt}{" "}
            <button
              type="button"
              className="text-white/80 underline-offset-4 hover:text-white hover:underline"
              onClick={() => setLocation(ROUTES.welcoming)}
            >
              {t.footer.kioskLink}
            </button>
          </p>
        </section>
      </main>

      <footer className="marketing-landing__footer relative z-10 border-t border-white/10 px-4 py-8 text-center text-xs text-white/40 sm:px-10">
        © {new Date().getFullYear()} Guest Pro · {t.footer.copyright}
      </footer>
    </div>
  );
}

export default function MarketingHome() {
  return (
    <MarketingLocaleProvider>
      <MarketingHomeContent />
    </MarketingLocaleProvider>
  );
}
