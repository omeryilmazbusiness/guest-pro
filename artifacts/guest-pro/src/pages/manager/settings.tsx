/**
 * Manager Settings — /manager/settings
 *
 * GM-only hub with sub-pages:
 *   /manager/settings/guest  — hotel map pin, nearby places, floor Wi-Fi
 *   /manager/settings/tracking — geofence, IP diagnostics, allowed networks
 */

import { useLocation } from "wouter";
import SettingsHubPage from "./settings/hub";
import GuestExperienceSettingsPage from "./settings/guest-experience";
import TrackingSettingsPage from "./settings/tracking";

export default function ManagerSettings() {
  const [location] = useLocation();

  if (location.includes("/manager/settings/guest")) {
    return <GuestExperienceSettingsPage />;
  }
  if (location.includes("/manager/settings/tracking")) {
    return <TrackingSettingsPage />;
  }
  return <SettingsHubPage />;
}
