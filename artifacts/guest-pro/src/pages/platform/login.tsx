import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IOS_EASE, PAGE_ENTER } from "@/components/login/login-motion";
import {
  platformLogin,
  platformVerifyOtp,
  type PlatformLoginChallenge,
} from "@/lib/platform-api";
import { usePlatformAuth } from "@/hooks/use-platform-auth";
import { ROUTES } from "@/lib/app-routes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "credentials" | "otp";

function SoftField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  icon: Icon,
  trailing,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  icon: typeof Mail;
  trailing?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[13px] font-medium text-stone-600">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-[52px] rounded-2xl border-stone-200/90 bg-stone-50/80 pl-11 text-[15px]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
            "focus-visible:border-stone-300 focus-visible:ring-2 focus-visible:ring-stone-900/10 focus-visible:ring-offset-0",
            trailing && "pr-12",
          )}
          required
        />
        {trailing}
      </div>
    </div>
  );
}

function formatRetry(ms?: number): string | null {
  if (!ms || ms <= 0) return null;
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.ceil(sec / 60)} min`;
}

export default function PlatformLogin() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, completeLogin } = usePlatformAuth();
  const credentialsInFlight = useRef(false);
  const verifyInFlight = useRef(false);
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<PlatformLoginChallenge | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lockRetry, setLockRetry] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation(ROUTES.platform, { replace: true });
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (!challenge) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [challenge]);

  const handleApiError = useCallback((err: unknown) => {
    const e = err as Error & { retryAfterMs?: number };
    setFormError(e.message ?? "Request failed");
    const retry = formatRetry(e.retryAfterMs);
    setLockRetry(retry);
  }, []);

  const onCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialsInFlight.current) return;
    credentialsInFlight.current = true;
    setFormError(null);
    setLockRetry(null);
    setSubmitting(true);
    try {
      const res = await platformLogin(email, password);
      setChallenge(res);
      setStep("otp");
      setOtp("");
      if (res.resent === false) {
        toast.message(`Use the code already sent to ${res.verificationEmailMasked}`);
      } else if (res.emailDelivery === "smtp") {
        toast.success(`Code sent to ${res.verificationEmailMasked}`);
      } else {
        toast.warning("SMTP not configured — check the API terminal for the 6-digit code");
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
      credentialsInFlight.current = false;
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || verifyInFlight.current) return;
    verifyInFlight.current = true;
    setFormError(null);
    setLockRetry(null);
    setSubmitting(true);
    try {
      const res = await platformVerifyOtp(challenge.challengeId, otp.trim(), email);
      completeLogin(res.token, res.user);
      toast.success("Welcome back");
      setLocation(ROUTES.platform, { replace: true });
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
      verifyInFlight.current = false;
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setChallenge(null);
    setOtp("");
    setFormError(null);
    setLockRetry(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f7f5f2]">
        <Loader2 className="h-7 w-7 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f7f5f2]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-[20%] top-[-10%] h-[55vh] w-[55vw] rounded-full bg-[#e8e2d8]/70 blur-[90px]" />
        <div className="absolute -right-[15%] bottom-[-15%] h-[50vh] w-[50vw] rounded-full bg-[#d9d4cb]/50 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-10">
        <motion.div
          className="w-full max-w-[400px]"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : PAGE_ENTER}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-white shadow-lg shadow-stone-300/25 ring-1 ring-stone-100">
              <GuestProLogo variant="login" className="h-12 w-12" />
            </div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 ring-1 ring-stone-200/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure sign-in
            </p>
            <h1 className="mt-3 font-serif text-2xl tracking-tight text-stone-900">
              {step === "credentials" ? "Platform sign in" : "Verification code"}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {step === "credentials"
                ? "Step 1 — operator credentials"
                : challenge?.emailDelivery === "console"
                  ? "Step 2 — code is in the API server log (SMTP not configured)"
                  : `Step 2 — code sent to ${challenge?.verificationEmailMasked ?? "your inbox"}`}
            </p>
          </div>

          <motion.div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_-24px_rgba(28,25,23,0.18)] ring-1 ring-stone-200/50 backdrop-blur-xl sm:p-8">
            <AnimatePresence mode="wait">
              {formError && (
                <motion.div
                  key="err"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 overflow-hidden rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                  {lockRetry && (
                    <p className="mt-1 text-xs text-red-600/90">Try again in {lockRetry}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {step === "credentials" ? (
              <form onSubmit={onCredentials} className="space-y-5">
                <SoftField
                  id="platform-email"
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={setEmail}
                  icon={Mail}
                />
                <SoftField
                  id="platform-password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={setPassword}
                  icon={Lock}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  }
                />
                <Button
                  type="submit"
                  className="h-[52px] w-full rounded-2xl bg-stone-900 text-[15px] font-medium"
                  disabled={submitting || !!lockRetry}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={onVerify} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="platform-otp" className="text-[13px] font-medium text-stone-600">
                    6-digit code
                  </Label>
                  <Input
                    id="platform-otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-[52px] rounded-2xl border-stone-200/90 bg-stone-50/80 text-center font-mono text-2xl tracking-[0.35em] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                    required
                  />
                  {challenge?.emailDelivery === "console" && (
                    <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-center text-xs text-amber-900">
                      No real email was sent. Open the terminal running{" "}
                      <span className="font-mono">pnpm dev</span> and look for{" "}
                      <span className="font-mono">email:console-fallback</span> — or add{" "}
                      <span className="font-mono">GMAIL_APP_PASSWORD</span> to{" "}
                      <span className="font-mono">.env</span>.
                    </p>
                  )}
                  <p className="text-center text-xs text-stone-500">
                    {secondsLeft > 0 ? (
                      <>Expires in <span className="font-mono tabular-nums">{secondsLeft}s</span></>
                    ) : (
                      <span className="text-amber-700">Code expired — go back and sign in again</span>
                    )}
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-[52px] w-full rounded-2xl bg-stone-900 text-[15px] font-medium"
                  disabled={submitting || otp.length !== 6 || secondsLeft <= 0 || !!lockRetry}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl text-stone-600"
                  onClick={backToCredentials}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
