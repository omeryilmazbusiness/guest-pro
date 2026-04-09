/**
 * GuestAutoLogin
 *
 * Route: /guest/auto-login?token=<rawToken>
 *
 * This page is the landing target for QR code scans. It:
 *   1. Reads the raw token from the URL query string
 *   2. Calls GET /api/auth/guest/qr-login?token=...
 *   3. On success: stores the auth token and navigates to /guest
 *   4. On failure: shows a professional, safe error state with a fallback to the login page
 *
 * The raw token is never stored; it is sent over HTTPS and consumed once.
 * After the server marks it used, any repeat attempt is rejected.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { GuestProLogo } from "@/components/GuestProLogo";
import { useAuth } from "@/hooks/use-auth";
import { guestQrLogin } from "@workspace/api-client-react";
import { Loader2, ShieldX, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "error";

const ERROR_TITLES: Record<string, string> = {
  qr_invalid: "QR Code Expired",
  guest_not_found: "Account Not Found",
  invalid_token: "Invalid QR Code",
  stay_access_denied: "Access Unavailable",
};

const ERROR_MESSAGES: Record<string, string> = {
  qr_invalid: "This QR code has expired or was already used.",
  guest_not_found: "The guest account linked to this QR code no longer exists.",
  invalid_token: "The QR code appears to be corrupted or incomplete.",
};

export default function GuestAutoLogin() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [errorTitle, setErrorTitle] = useState<string>("QR Code Expired");
  const [errorMessage, setErrorMessage] = useState<string>(
    "This QR code is no longer valid."
  );
  const didRun = useRef(false); // Prevent StrictMode double-invoke

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const params = new URLSearchParams(search);
    const rawToken = params.get("token");

    if (!rawToken || rawToken.length < 10) {
      setErrorTitle("Invalid QR Code");
      setErrorMessage("The QR code is missing a valid login token.");
      setStatus("error");
      return;
    }

    guestQrLogin({ token: rawToken })
      .then((res) => {
        setToken(res.token);
        setStatus("success");
        // Brief success pause so the guest sees the confirmation before redirect
        setTimeout(() => setLocation("/guest"), 1200);
      })
      .catch((err: unknown) => {
        let code: string | undefined;
        let apiMessage: string | undefined;
        try {
          const body = (err as { data?: { code?: string; error?: string } }).data;
          code = body?.code;
          apiMessage = body?.error;
        } catch {
          /* ignore */
        }
        // Use the code-specific title, or a generic one
        setErrorTitle(
          code && ERROR_TITLES[code] ? ERROR_TITLES[code] : "QR Code Expired"
        );
        // Prefer the API's own professional message (e.g., stay denial),
        // then the code-specific fallback, then the generic fallback.
        setErrorMessage(
          apiMessage && code === "stay_access_denied"
            ? apiMessage
            : code && ERROR_MESSAGES[code]
              ? ERROR_MESSAGES[code]
              : "This QR code is no longer valid. Please ask hotel staff for assistance."
        );
        setStatus("error");
      });
  }, [search, setToken, setLocation]);

  return (
    <div className="min-h-[100dvh] bg-zinc-900 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10">
        <GuestProLogo variant="login" className="w-16 h-16 opacity-90" />
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-5 animate-in fade-in duration-300">
          <Loader2 className="w-9 h-9 text-zinc-300 animate-spin" />
          <p className="text-zinc-300 text-base font-medium">
            Signing you in securely…
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-400">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <div className="text-center">
            <p className="text-white text-xl font-serif font-medium mb-1">
              Welcome!
            </p>
            <p className="text-zinc-400 text-sm">Taking you to your room…</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-6 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <h1 className="text-white text-xl font-serif font-medium mb-3">
              {errorTitle}
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div className="w-full flex flex-col gap-3">
            <Button
              className="w-full h-12 rounded-2xl bg-white text-zinc-900 font-medium hover:bg-zinc-100"
              onClick={() => setLocation("/")}
            >
              Sign in with Guest Key
            </Button>
          </div>
          <p className="text-xs text-zinc-600 text-center">
            QR codes are single-use and expire after 24 hours.
            <br />
            Hotel staff can generate a new one.
          </p>
        </div>
      )}
    </div>
  );
}
