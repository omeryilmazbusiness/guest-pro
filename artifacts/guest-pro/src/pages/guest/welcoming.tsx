/**
 * GuestWelcoming — /welcoming
 *
 * Kiosk registration entry: fixed brand header + responsive QR hero.
 * Optimized for mobile viewports (no horizontal overflow, scroll when needed).
 */

import { KioskBrandHeader } from "@/components/kiosk/KioskBrandHeader";
import { RegisterQrCard } from "@/components/welcoming/RegisterQrCard";

export default function GuestWelcoming() {
  const scanUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/guest/passport-scan`;

  return (
    <div className="welcoming-screen">
      <div className="passport-welcome-vignette pointer-events-none" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 backdrop-blur-[1px]"
        aria-hidden="true"
      />

      <KioskBrandHeader variant="fixed" />

      <main className="welcoming-screen__main">
        <RegisterQrCard scanUrl={scanUrl} />
      </main>
    </div>
  );
}
