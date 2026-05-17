/**
 * GuestWelcoming — /welcoming
 *
 * Kiosk registration entry: fixed brand header + premium QR hero.
 */

import { KioskBrandHeader } from "@/components/kiosk/KioskBrandHeader";
import { RegisterQrCard } from "@/components/welcoming/RegisterQrCard";

export default function GuestWelcoming() {
  const scanUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/guest/passport-scan`;

  return (
    <div className="min-h-dvh flex flex-col bg-black overflow-hidden relative">
      <div className="passport-welcome-vignette" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 backdrop-blur-[1px]"
        aria-hidden="true"
      />

      <KioskBrandHeader variant="fixed" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-[480px] mx-auto px-5 sm:px-6 pt-[max(4.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <RegisterQrCard scanUrl={scanUrl} />
      </div>
    </div>
  );
}
