import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogin, useGetGoogleAuthStatus } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Loader2,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const managerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const guestSchema = z.object({
  guestKey: z.string().min(1, "Please enter your guest key"),
});

type ManagerForm = z.infer<typeof managerSchema>;
type GuestForm = z.infer<typeof guestSchema>;

// ---------------------------------------------------------------------------
// Google error message map
// ---------------------------------------------------------------------------
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured for this instance.",
  google_denied: "Google sign-in was cancelled.",
  google_invalid_state: "Security check failed. Please try again.",
  google_no_code: "No authorization received from Google. Please try again.",
  google_profile_failed: "Could not retrieve your Google profile. Please try again.",
  google_no_hotel: "No hotel account found. Contact your administrator.",
  google_server_error: "A server error occurred during sign-in. Please try again.",
};

// ---------------------------------------------------------------------------
// Google SVG icon
// ---------------------------------------------------------------------------
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Full-screen loading overlay used for the Google exchange flow
// ---------------------------------------------------------------------------
function ExchangingOverlay() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50/50 gap-5">
      <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-zinc-100 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-zinc-500" />
      </div>
      <p className="text-zinc-500 font-medium text-base">Signing you in…</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal-toggle button (shared between guest key and password)
// ---------------------------------------------------------------------------
function RevealToggle({
  revealed,
  onToggle,
  label,
}: {
  revealed: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      {revealed ? (
        <EyeOff className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Eye className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Login() {
  const { user, isAuthenticated, setToken, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const [mode, setMode] = useState<"guest" | "manager">("guest");
  const [showGuestKey, setShowGuestKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExchangingGoogle, setIsExchangingGoogle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: googleStatus, isLoading: googleStatusLoading } =
    useGetGoogleAuthStatus();

  const managerForm = useForm<ManagerForm>({
    resolver: zodResolver(managerSchema),
    defaultValues: { email: "", password: "" },
  });

  const guestForm = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestKey: "" },
  });

  // Handle Google OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleCode = params.get("google_code");
    const error = params.get("error");

    // Clean URL immediately so params don't persist on refresh
    if (googleCode || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (googleCode) {
      setIsExchangingGoogle(true);
      fetch(`/api/auth/google/exchange?code=${encodeURIComponent(googleCode)}`)
        .then((r) => r.json())
        .then((data: { token?: string; error?: string }) => {
          if (data.token) {
            setToken(data.token);
            toast.success("Signed in with Google");
            setLocation("/manager");
          } else {
            setIsExchangingGoogle(false);
            setMode("manager");
            setFormError(data.error ?? "Google sign-in failed. Please try again.");
          }
        })
        .catch(() => {
          setIsExchangingGoogle(false);
          setMode("manager");
          setFormError("Google sign-in failed. Please try again.");
        });
      return;
    }

    if (error) {
      const message =
        GOOGLE_ERROR_MESSAGES[error] ?? "An error occurred. Please try again.";
      setMode("manager");
      setFormError(message);
    }
  }, []);

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "manager" || user.role === "personnel") setLocation("/manager");
      else setLocation("/guest");
    }
  }, [isAuthenticated, user, setLocation]);

  // Switch tab and clean up stale state
  const switchMode = useCallback(
    (next: "guest" | "manager") => {
      if (next === mode) return;
      setMode(next);
      setFormError(null);
      loginMutation.reset();
    },
    [mode, loginMutation]
  );

  // Show full-page loading while the session is being restored from token
  if (authLoading || isExchangingGoogle) {
    return isExchangingGoogle ? (
      <ExchangingOverlay />
    ) : (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Submit handlers
  // ---------------------------------------------------------------------------
  const onSubmitGuest = (data: GuestForm) => {
    setFormError(null);
    loginMutation.mutate(
      { data: { type: "guest", guestKey: data.guestKey } },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast.success("Welcome to your stay");
          setLocation("/guest");
        },
        onError: (err) => {
          const msg = err.data?.error ?? "Invalid or inactive guest key.";
          setFormError(msg);
        },
      }
    );
  };

  const onSubmitManager = (data: ManagerForm) => {
    setFormError(null);
    loginMutation.mutate(
      { data: { type: "manager", email: data.email, password: data.password } },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast.success("Welcome back");
          setLocation("/manager");
        },
        onError: (err) => {
          const msg = err.data?.error ?? "Sign-in failed. Please check your credentials.";
          setFormError(msg);
        },
      }
    );
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  // Google button state
  const googleReady = !googleStatusLoading && googleStatus?.configured === true;
  const googleNotConfigured = !googleStatusLoading && googleStatus?.configured === false;
  const googleButtonDisabled =
    googleStatusLoading || !googleStatus?.configured || loginMutation.isPending;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50/50 px-4 py-10 md:py-16">
      <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Brand header */}
        <header className="text-center space-y-4">
          <div className="flex flex-col items-center gap-5">
            <div className="inline-flex items-center justify-center w-[88px] h-[88px] rounded-[28px] bg-white shadow-md shadow-zinc-200/60 border border-zinc-100/80">
              <GuestProLogo variant="login" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-serif tracking-tight text-zinc-900">
                Guest Pro
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                A premium stay experience
              </p>
            </div>
          </div>
        </header>

        {/* Card */}
        <Card className="border border-zinc-100 shadow-xl shadow-zinc-200/40 rounded-3xl bg-white">

          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Login type"
            className="flex p-2 bg-zinc-50 rounded-t-3xl border-b border-zinc-100"
          >
            <button
              role="tab"
              aria-selected={mode === "guest"}
              aria-controls="panel-guest"
              id="tab-guest"
              data-testid="tab-guest"
              type="button"
              onClick={() => switchMode("guest")}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
                mode === "guest"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 active:text-zinc-900"
              }`}
            >
              Guest Key
            </button>
            <button
              role="tab"
              aria-selected={mode === "manager"}
              aria-controls="panel-manager"
              id="tab-manager"
              data-testid="tab-manager"
              type="button"
              onClick={() => switchMode("manager")}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
                mode === "manager"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 active:text-zinc-900"
              }`}
            >
              Staff
            </button>
          </div>

          <CardContent className="p-6 md:p-8">

            {/* Shared inline error banner */}
            {formError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
              >
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {/* ── Guest panel ── */}
            {mode === "guest" && (
              <div
                id="panel-guest"
                role="tabpanel"
                aria-labelledby="tab-guest"
              >
                <Form {...guestForm}>
                  <form
                    onSubmit={guestForm.handleSubmit(onSubmitGuest)}
                    className="space-y-5"
                    noValidate
                  >
                    <FormField
                      control={guestForm.control}
                      name="guestKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <KeyRound
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
                                aria-hidden="true"
                              />
                              <Input
                                id="guest-key-input"
                                data-testid="input-guest-key"
                                aria-label="Guest key"
                                placeholder="Enter your guest key"
                                type={showGuestKey ? "text" : "password"}
                                autoComplete="off"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                className="pl-12 pr-12 h-14 text-base rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400 font-mono tracking-widest"
                                {...field}
                              />
                              <RevealToggle
                                revealed={showGuestKey}
                                onToggle={() => setShowGuestKey((p) => !p)}
                                label={showGuestKey ? "Hide guest key" : "Show guest key"}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      data-testid="button-submit"
                      type="submit"
                      className="w-full h-14 rounded-2xl text-base font-medium shadow-md shadow-zinc-900/15"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                          Checking key…
                        </>
                      ) : (
                        "Access your stay"
                      )}
                    </Button>
                  </form>
                </Form>

                <p className="mt-5 text-center text-xs text-zinc-400 leading-relaxed">
                  Your guest key was provided at check-in.
                  <br />
                  Contact the front desk if you need assistance.
                </p>
              </div>
            )}

            {/* ── Manager / Staff panel ── */}
            {mode === "manager" && (
              <div
                id="panel-manager"
                role="tabpanel"
                aria-labelledby="tab-manager"
                className="space-y-5"
              >
                {/* Email + password form */}
                <Form {...managerForm}>
                  <form
                    onSubmit={managerForm.handleSubmit(onSubmitManager)}
                    className="space-y-4"
                    noValidate
                    autoComplete="on"
                  >
                    <FormField
                      control={managerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Mail
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
                                aria-hidden="true"
                              />
                              <Input
                                id="manager-email-input"
                                data-testid="input-email"
                                aria-label="Email address"
                                placeholder="Email address"
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={managerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Lock
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
                                aria-hidden="true"
                              />
                              <Input
                                id="manager-password-input"
                                data-testid="input-password"
                                aria-label="Password"
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                className="pl-12 pr-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
                                {...field}
                              />
                              <RevealToggle
                                revealed={showPassword}
                                onToggle={() => setShowPassword((p) => !p)}
                                label={showPassword ? "Hide password" : "Show password"}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      data-testid="button-submit-manager"
                      type="submit"
                      className="w-full h-14 rounded-2xl text-base font-medium shadow-md shadow-zinc-900/15"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                          Signing in…
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Divider */}
                <div className="relative" aria-hidden="true">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-zinc-400 font-medium">
                      or
                    </span>
                  </div>
                </div>

                {/* Google button — always rendered; disabled when unconfigured */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="button-google"
                    aria-label="Continue with Google"
                    aria-disabled={googleButtonDisabled}
                    disabled={googleButtonDisabled}
                    className={`w-full h-14 rounded-2xl text-base font-medium border-zinc-200 transition-all
                      ${googleReady
                        ? "hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer"
                        : "opacity-60 cursor-not-allowed"
                      }`}
                    onClick={googleReady ? handleGoogleSignIn : undefined}
                  >
                    {googleStatusLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-3 text-zinc-400" aria-hidden="true" />
                    ) : (
                      <GoogleIcon className="w-5 h-5 mr-3 shrink-0" />
                    )}
                    Continue with Google
                  </Button>

                  {/* Config hint — only shown when explicitly not configured */}
                  {googleNotConfigured && (
                    <p className="text-center text-xs text-zinc-400 leading-relaxed flex items-center justify-center gap-1.5">
                      <Info className="w-3 h-3 shrink-0" aria-hidden="true" />
                      Google sign-in requires{" "}
                      <code className="font-mono text-zinc-500">
                        AUTH_GOOGLE_CLIENT_ID
                      </code>{" "}
                      and{" "}
                      <code className="font-mono text-zinc-500">
                        AUTH_GOOGLE_CLIENT_SECRET
                      </code>
                      .
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
