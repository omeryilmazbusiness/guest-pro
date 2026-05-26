/**
 * GuestWelcoming — /{hotelSlug}/welcoming
 *
 * Per-hotel kiosk registration entry: brand header + QR to this hotel's passport scan.
 */

import { KioskBrandHeader } from "@/components/kiosk/KioskBrandHeader";
import { RegisterQrCard } from "@/components/welcoming/RegisterQrCard";
import { useHotelTenant } from "@/hooks/use-hotel-tenant";
import { ROUTES } from "@/lib/app-routes";
import { absoluteAppHref, hotelPath } from "@/lib/tenant-path";

export default function GuestWelcoming() {
  const { slug } = useHotelTenant();
  const scanUrl = absoluteAppHref(hotelPath(slug, ROUTES.guestPassportScan));

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
