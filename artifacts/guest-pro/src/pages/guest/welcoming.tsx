/**
 * GuestWelcoming — /welcoming
 *
 * TRUE PUBLIC ROUTE — no auth required.
 *
 * Two-stage premium welcoming experience:
 *
 * Stage 1 — Hero (full-viewport black card):
 *   Cycling greeting loop · language selector · "Explore hotel info" button
 *
 * Stage 2 — Public info dashboard (below the fold, scrolled into view on Continue):
 *   Wi-Fi · Emergency · Dining hours · Menu · Nearby places · Support
 *   Unauthenticated visitors see a "Login to access your stay" CTA in the Support card.
 *   Authenticated guests see the "Open Concierge" button instead.
 *
 * Navigation rules (no login is ever forced):
 *   Hero button (unauthenticated)    → smooth-scroll to info dashboard
 *   Hero button (authenticated)      → navigate to /guest or /manager
 *   Info bottom CTA (unauthenticated)→ persist locale → navigate to / (login)
 *   Info bottom CTA (authenticated)  → persist locale → navigate to /guest
 *   SupportCard login btn            → persist locale → navigate to / (login)
 *   SupportCard concierge btn        → navigate to /guest/chat (auth required, page guards itself)
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
  // Auth is consulted to decide navigation destinations only — never to block access.
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const infoRef = useRef<HTMLDivElement>(null);

  const [selectedLocale, setSelectedLocale] = useState<WelcomingLocale>(
    () => getPersistedWelcomingLocale(),
  );

  const s = getWelcomingStrings(selectedLocale);
  const dir = selectedLocale === "ur" ? "rtl" : "ltr";

  // ── Helpers ────────────────────────────────────────────────────────────────

  function scrollToInfo() {
    infoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Called when an authenticated user taps any "go to dashboard" CTA. */
  function navigateToDashboard() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();
    if (user?.role === "guest") {
      setLocation("/guest");
    } else {
      setLocation("/manager");
    }
  }

  /** Called when an unauthenticated visitor deliberately chooses to log in. */
  function navigateToLogin() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();
    setLocation("/");
  }

  // ── Hero button handler ────────────────────────────────────────────────────

  /**
   * "Explore hotel info" / "Continue to your stay"
   *   - Authenticated → go to dashboard immediately (they've already chosen their language before)
   *   - Unauthenticated → reveal the public info dashboard (stay on /welcoming)
   */
  function handleHeroContinue() {
    persistWelcomingLocale(selectedLocale);
    if (isAuthenticated && user) {
      markWelcomingAsSeen();
      if (user.role === "guest") {
        setLocation("/guest");
      } else {
        setLocation("/manager");
      }
    } else {
      // Show the info dashboard — no redirect
      scrollToInfo();
    }
  }

  // ── Info-section button handlers ───────────────────────────────────────────

  /**
   * Bottom "Access your stay" / "Go to dashboard" CTA inside the info section.
   * This is the only place that navigates away — and only when the user explicitly asks.
   */
  function handleAccessStay() {
    if (isAuthenticated && user) {
      navigateToDashboard();
    } else {
      navigateToLogin();
    }
  }

  /**
   * "Open Concierge" — requires login.
   * For authenticated guests it goes directly to chat.
   * For unauthenticated visitors it is replaced by the login prompt (see SupportCard).
   */
  function handleOpenConcierge() {
    persistWelcomingLocale(selectedLocale);
    markWelcomingAsSeen();
    setLocation("/guest/chat");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div dir={dir} className="min-h-[100dvh] bg-stone-50 flex flex-col">

      {/* ── STAGE 1: Hero — full viewport ─────────────────────────────────── */}
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
          {/* Cycling greeting */}
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

          {/* Hero CTA */}
          <button
            onClick={handleHeroContinue}
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

        {/* Scroll hint — always visible, invites exploration */}
        <button
          onClick={scrollToInfo}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30 hover:opacity-60 transition-opacity"
          aria-label="Scroll to hotel information"
        >
          <Globe2 className="w-4 h-4 text-zinc-600" />
          <ChevronDown className="w-4 h-4 text-zinc-600 animate-bounce" />
        </button>
      </section>

      {/* ── STAGE 2: Public info dashboard ────────────────────────────────── */}
      <section
        ref={infoRef}
        className="w-full max-w-3xl mx-auto px-5 py-12 md:py-16 flex flex-col gap-6"
      >
        <InfoBlocks
          config={HOTEL_CONFIG}
          s={s}
          locale={selectedLocale}
          isAuthenticated={isAuthenticated}
          onOpenConcierge={handleOpenConcierge}
          onAccessStay={handleAccessStay}
        />

        {/* Bottom CTA — "Access your stay" or "Go to dashboard" */}
        <div className="flex justify-center pt-6 pb-4">
          <button
            onClick={handleAccessStay}
            className={cn(
              "flex items-center gap-2 px-7 py-3.5 rounded-2xl",
              "bg-zinc-900 text-white text-sm font-semibold",
              "hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150",
              "shadow-lg shadow-zinc-900/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
            )}
          >
            {isAuthenticated ? s.continueToStay : s.accessYourStay}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
