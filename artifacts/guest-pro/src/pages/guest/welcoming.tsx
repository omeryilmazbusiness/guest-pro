/**
 * GuestWelcoming — /welcoming
 *
 * Premium desktop-first welcome screen. Flow:
 *   1. Guest lands here (auth-protected; redirects to / if not authenticated).
 *   2. Greeting loop plays in a centered black card.
 *   3. Guest selects one of 6 supported languages via the premium selector.
 *   4. Taps "Continue" → locale is persisted, welcoming is marked seen, navigates to /guest.
 *   5. Info blocks below the fold show Wi-Fi, dining, emergency, menu, nearby, support.
 *
 * The selected locale is stored in localStorage (guestpro_welcoming_locale) and
 * read by useLocale to override the profile language across all guest pages.
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ChevronDown, Globe2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GuestProLogo } from "@/components/GuestProLogo";
import { GreetingLoop } from "@/components/welcoming/GreetingLoop";
import { LanguageSelector } from "@/components/welcoming/LanguageSelector";
import { InfoBlocks } from "@/components/welcoming/InfoBlocks";
import {
  getPersistedWelcomingLocale,
  persistWelcomingLocale,
  markWelcomingAsSeen,
} from "@/lib/welcoming/welcoming-locale";
import { getWelcomingStrings, HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import type { WelcomingLocale } from "@/lib/welcoming/types";
import { cn } from "@/lib/utils";

export default function GuestWelcoming() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const infoRef = useRef<HTMLDivElement>(null);

  const [selectedLocale, setSelectedLocale] = useState<WelcomingLocale>(
    () => getPersistedWelcomingLocale(),
  );

  // Auth guard — wait until auth resolves before redirecting
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
    if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const s = getWelcomingStrings(selectedLocale);
  const dir = selectedLocale === "ur" ? "rtl" : "ltr";

  function handleContinue() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();
    setLocation("/guest");
  }

  function handleScrollToInfo() {
    infoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleOpenConcierge() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();
    setLocation("/guest/chat");
  }

  if (isLoading || !isAuthenticated || user?.role !== "guest") {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-[100dvh] bg-stone-50 flex flex-col">
      {/* ── Hero section — full viewport ───────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 py-16 md:py-20">

        {/* Subtle logo stamp — top center */}
        <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
          <GuestProLogo variant="header" className="w-5 h-5 invert" />
          <span className="text-xs font-medium text-zinc-900 tracking-wide">
            {HOTEL_CONFIG.name}
          </span>
        </div>

        {/* ── Premium black card ───────────────────────────────────────────── */}
        <div
          className={cn(
            "w-full max-w-sm",
            "bg-zinc-950 border border-zinc-800/40 rounded-3xl",
            "shadow-2xl shadow-black/25",
            "px-8 py-10 md:px-10 md:py-12",
            "flex flex-col gap-8",
            "animate-in fade-in zoom-in-95 duration-700",
          )}
        >
          {/* Greeting loop */}
          <GreetingLoop />

          {/* Subtitle */}
          <div className="text-center -mt-2">
            <p className="text-sm font-light text-zinc-400 tracking-wide">
              {s.greetingSubtitle}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-800" />

          {/* Language selector */}
          <LanguageSelector
            selected={selectedLocale}
            onSelect={setSelectedLocale}
            label={s.selectLanguage}
          />

          {/* Continue CTA */}
          <button
            onClick={handleContinue}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-12 rounded-2xl",
              "bg-white text-zinc-900",
              "text-sm font-semibold tracking-wide",
              "transition-all duration-150",
              "hover:bg-zinc-100 active:scale-[0.98]",
              "shadow-lg shadow-white/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            )}
          >
            {s.continueToStay}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scroll hint */}
        <button
          onClick={handleScrollToInfo}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30 hover:opacity-60 transition-opacity"
          aria-label="Scroll to hotel information"
        >
          <Globe2 className="w-4 h-4 text-zinc-600" />
          <ChevronDown className="w-4 h-4 text-zinc-600 animate-bounce" />
        </button>
      </section>

      {/* ── Hotel information blocks ────────────────────────────────────────── */}
      <section
        ref={infoRef}
        className="w-full max-w-3xl mx-auto px-5 py-12 md:py-16 flex flex-col gap-6"
      >
        <InfoBlocks
          config={HOTEL_CONFIG}
          s={s}
          onOpenConcierge={handleOpenConcierge}
        />

        {/* Bottom CTA */}
        <div className="flex justify-center pt-6 pb-4">
          <button
            onClick={handleContinue}
            className={cn(
              "flex items-center gap-2 px-7 py-3.5 rounded-2xl",
              "bg-zinc-900 text-white text-sm font-semibold",
              "hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150",
              "shadow-lg shadow-zinc-900/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
            )}
          >
            {s.continueToStay}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
