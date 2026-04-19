/**
 * GuestWelcoming — /welcoming
 *
 * TRUE PUBLIC ROUTE — no auth required.
 *
 * Premium entry experience before (or after) guest login.
 *
 * Flow A — pre-login (unauthenticated):
 *   Guest opens /welcoming directly → selects language → taps "Continue" → /  (login)
 *   After login, home.tsx sees hasSeenWelcoming() = true → stays on /guest.
 *
 * Flow B — post-login (already authenticated as guest):
 *   home.tsx sees !hasSeenWelcoming() → redirects to /welcoming → guest selects language
 *   → taps "Continue" → /guest.
 *
 * Flow C — returning guest changes language (Globe icon in header → /welcoming):
 *   Already authenticated → Continue goes to /guest.
 *
 * Route guard: NONE. This page renders for everyone without any token check.
 * Protected routes (/guest, /manager, etc.) retain their own guards unchanged.
 */

import { useState, useRef } from "react";
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
  // Auth is read only to decide where "Continue" navigates — NOT to gate access.
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const infoRef = useRef<HTMLDivElement>(null);

  const [selectedLocale, setSelectedLocale] = useState<WelcomingLocale>(
    () => getPersistedWelcomingLocale(),
  );

  const s = getWelcomingStrings(selectedLocale);
  const dir = selectedLocale === "ur" ? "rtl" : "ltr";

  /**
   * Persist the language choice and mark welcoming as seen so home.tsx
   * doesn't redirect back here on the next visit, then navigate:
   *   - authenticated guest → /guest (their dashboard)
   *   - authenticated manager/personnel → /manager
   *   - unauthenticated → / (login page, guest key or staff)
   */
  function handleContinue() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();

    if (isAuthenticated && user) {
      if (user.role === "guest") {
        setLocation("/guest");
      } else {
        setLocation("/manager");
      }
    } else {
      setLocation("/");
    }
  }

  function handleScrollToInfo() {
    infoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleOpenConcierge() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();

    if (isAuthenticated && user?.role === "guest") {
      setLocation("/guest/chat");
    } else {
      setLocation("/");
    }
  }

  return (
    <div dir={dir} className="min-h-[100dvh] bg-stone-50 flex flex-col">
      {/* ── Hero section — full viewport ───────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 py-16 md:py-20">

        {/* Subtle hotel stamp — top center */}
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
