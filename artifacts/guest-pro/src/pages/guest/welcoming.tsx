/**
 * GuestWelcoming — /welcoming
 *
 * TRUE PUBLIC ROUTE — no auth required, NO auth awareness.
 * This is a hotel kiosk/lobby display screen.
 *
 * It MUST NEVER read or act on any existing auth session (localStorage token).
 * Guest authentication happens exclusively via:
 *   - /guest/auto-login  (one-time QR scan token)
 *   - /                  (guest key login)
 *
 * Stage 1 — Hero (full-viewport black card):
 *   Single registration QR + cycling multi-language "Scan QR to register" label.
 *
 * Stage 2 — Public info dashboard (below the fold):
 *   Wi-Fi · Emergency · Dining hours · Menu · Nearby places · Support
 */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Globe2 } from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { RegisterQrCard } from "@/components/welcoming/RegisterQrCard";
import { LanguageSelector } from "@/components/welcoming/LanguageSelector";
import { InfoBlocks } from "@/components/welcoming/InfoBlocks";
import {
  getPersistedWelcomingLocale,
  persistWelcomingLocale,
} from "@/lib/welcoming/welcoming-locale";
import { getWelcomingStrings, HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import type { WelcomingLocale } from "@/lib/welcoming/types";
import { cn } from "@/lib/utils";

export default function GuestWelcoming() {
  // ⚠️ NO useAuth here — public kiosk must NEVER read localStorage auth token.
  // Any visitor — authenticated or not — sees exactly the same public content.
  // Buttons on this page only redirect to the login page (/), never to /guest/chat.
  const [, setLocation] = useLocation();
  const infoRef = useRef<HTMLDivElement>(null);

  const [selectedLocale, setSelectedLocale] = useState<WelcomingLocale>(
    () => getPersistedWelcomingLocale(),
  );

  const s = getWelcomingStrings(selectedLocale);
  const dir = selectedLocale === "ur" ? "rtl" : "ltr";

  // Absolute URL so the QR works on any network / base-path deployment
  const scanUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/guest/passport-scan`;

  function scrollToInfo() {
    infoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // The only action the support card can take is directing guests to the
  // login page. This page NEVER performs or inherits any login or chat access.
  function handleGoToLogin() {
    setLocation("/");
  }

  return (
    <div dir={dir} className="min-h-dvh bg-stone-50 flex flex-col">

      {/* ── STAGE 1: Hero — full viewport ─────────────────────────────────── */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center px-5 py-16 md:py-20">

        {/* Hotel stamp — top center */}
        <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
          <GuestProLogo variant="header" className="w-5 h-5 invert" />
          <span className="text-xs font-medium text-zinc-900 tracking-wide">
            {HOTEL_CONFIG.name}
          </span>
        </div>

        {/* ── Premium black card — QR only ────────────────────────────────── */}
        <div
          className={cn(
            "w-full max-w-sm",
            "bg-zinc-950 border border-zinc-800/40 rounded-3xl",
            "shadow-2xl shadow-black/25",
            "px-8 py-10 md:px-10 md:py-12",
            "flex flex-col items-center gap-6",
            "animate-in fade-in zoom-in-95 duration-700",
          )}
        >
          <RegisterQrCard scanUrl={scanUrl} />
          <div className="h-px w-full bg-zinc-800" />
          <LanguageSelector
            selected={selectedLocale}
            onSelect={(l) => {
              setSelectedLocale(l);
              persistWelcomingLocale(l);
            }}
            label={s.selectLanguage}
          />
        </div>

        {/* Scroll hint */}
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
        {/*
          isAuthenticated is hardcoded false — this is a public kiosk display.
          No existing localStorage token can ever grant concierge/chat access.
          Both callbacks redirect to the login page (/), never to /guest/chat.
        */}
        <InfoBlocks
          config={HOTEL_CONFIG}
          s={s}
          locale={selectedLocale}
          isAuthenticated={false}
          onOpenConcierge={handleGoToLogin}
          onAccessStay={handleGoToLogin}
        />
      </section>
    </div>
  );
}
