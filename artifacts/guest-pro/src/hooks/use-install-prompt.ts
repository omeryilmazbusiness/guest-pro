import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "guestpro_install";
const COOLDOWN_DAYS = 7;

type InstallStatus = "pending" | "installed" | "dismissed" | "unavailable";

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

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function shouldShowPrompt(state: InstallState): boolean {
  if (state.status === "installed") return false;
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
  isIOSDevice: boolean;
  isAlreadyInstalled: boolean;
  triggerInstall: () => Promise<void>;
  dismiss: (permanent?: boolean) => void;
  openSheet: () => void;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  const iosDevice = isIOS();

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

    const timer = setTimeout(() => {
      const fresh = loadState();
      if (shouldShowPrompt(fresh)) {
        setShowSheet(true);
      }
    }, 3500);

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

  const dismiss = useCallback((permanent = false) => {
    saveState(
      permanent
        ? { status: "dismissed", dismissedAt: Date.now() - 1000 * 60 * 60 * 24 * COOLDOWN_DAYS }
        : { status: "dismissed", dismissedAt: Date.now() }
    );
    setShowSheet(false);
  }, []);

  const openSheet = useCallback(() => {
    setShowSheet(true);
  }, []);

  return {
    showSheet,
    canNativeInstall: !!deferredPrompt,
    isIOSDevice: iosDevice,
    isAlreadyInstalled,
    triggerInstall,
    dismiss,
    openSheet,
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
