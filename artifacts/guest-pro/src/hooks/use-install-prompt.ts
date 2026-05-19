import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "guestpro_install";
const FRESH_LOGIN_KEY = "guestpro_fresh_login";
const COOLDOWN_DAYS = 7;

/** Call after a successful guest login so the install guide shows on dashboard. */
export function markFreshGuestLogin(): void {
  try {
    sessionStorage.setItem(FRESH_LOGIN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function isFreshLoginSession(): boolean {
  try {
    return sessionStorage.getItem(FRESH_LOGIN_KEY) === "1";
  } catch {
    return false;
  }
}

function clearFreshLoginSession(): void {
  try {
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  } catch {
    /* ignore */
  }
}

type InstallStatus = "pending" | "installed" | "dismissed" | "permanent";

interface InstallState {
  status: InstallStatus;
  dismissedAt?: number;
}

function loadState(): InstallState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as InstallState;
  } catch {
    /* ignore */
  }
  return { status: "pending" };
}

function saveState(s: InstallState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Detects iOS/iPadOS including iPadOS 13+ which reports MacIntel platform
 * but has multiple touch points.
 */
function isIOSDevice(): boolean {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel with touch support
  if (
    typeof navigator.platform !== "undefined" &&
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

function isIPad(): boolean {
  if (/ipad/i.test(navigator.userAgent)) return true;
  // iPadOS 13+
  if (
    typeof navigator.platform !== "undefined" &&
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

function shouldShowPrompt(state: InstallState): boolean {
  if (state.status === "installed") return false;
  if (state.status === "permanent") return false;
  if (state.status === "dismissed" && state.dismissedAt) {
    const daysSince =
      (Date.now() - state.dismissedAt) / (1000 * 60 * 60 * 24);
    if (daysSince < COOLDOWN_DAYS) return false;
  }
  return true;
}

export interface UseInstallPromptReturn {
  showSheet: boolean;
  canNativeInstall: boolean;
  isIOS: boolean;
  isIPad: boolean;
  isAlreadyInstalled: boolean;
  triggerInstall: () => Promise<void>;
  dismiss: () => void;
  dismissPermanent: () => void;
  openSheet: () => void;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  const ios = isIOSDevice();
  const ipad = isIPad();

  useEffect(() => {
    if (isStandalone()) {
      setIsAlreadyInstalled(true);
      saveState({ status: "installed" });
      return;
    }

    const state = loadState();
    if (!shouldShowPrompt(state)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const appInstalled = () => {
      setIsAlreadyInstalled(true);
      setShowSheet(false);
      saveState({ status: "installed" });
    };
    window.addEventListener("appinstalled", appInstalled);

    const freshLogin = isFreshLoginSession();
    if (freshLogin) clearFreshLoginSession();

    // Show after dashboard load — sooner on first login in this session
    const delayMs = freshLogin ? 900 : 1800;
    const timer = setTimeout(() => {
      const fresh = loadState();
      if (shouldShowPrompt(fresh)) {
        setShowSheet(true);
      }
    }, delayMs);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt as BeforeInstallPromptEvent;
    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") {
      saveState({ status: "installed" });
      setIsAlreadyInstalled(true);
    }
    setDeferredPrompt(null);
    setShowSheet(false);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    saveState({ status: "dismissed", dismissedAt: Date.now() });
    setShowSheet(false);
  }, []);

  const dismissPermanent = useCallback(() => {
    saveState({ status: "permanent" });
    setShowSheet(false);
  }, []);

  const openSheet = useCallback(() => {
    setShowSheet(true);
  }, []);

  return {
    showSheet,
    canNativeInstall: !!deferredPrompt,
    isIOS: ios,
    isIPad: ipad,
    isAlreadyInstalled,
    triggerInstall,
    dismiss,
    dismissPermanent,
    openSheet,
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
