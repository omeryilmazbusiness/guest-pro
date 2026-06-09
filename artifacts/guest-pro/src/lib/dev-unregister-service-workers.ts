/**
 * Dev-only: unregister stale service workers that intercept Vite HMR
 * and trigger navigation preload cancellation warnings.
 */
export async function clearStaleServiceWorkersInDev(): Promise<void> {
  if (import.meta.env.PROD) return;
  if (import.meta.env.VITE_PWA_DEV === "1") return;
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) return;

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.includes("workbox") || key.includes("guestpro") || key.includes("google-fonts"))
        .map((key) => caches.delete(key)),
    );
  }
}
