/** Broadcast after GM saves a setup-wizard-related section so dashboard refreshes. */
export function notifyHotelSetupChanged(): void {
  window.dispatchEvent(new CustomEvent("hotel-setup-changed"));
}
