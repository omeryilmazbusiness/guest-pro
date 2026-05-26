import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IOS_EASE, PAGE_ENTER } from "@/components/login/login-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
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
import { markFreshGuestLogin } from "@/hooks/use-install-prompt";
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
import { LoginModeSwitcher } from "@/components/login/LoginModeSwitcher";
import { LoginTabPanel, getLoginSlideDirection } from "@/components/login/LoginTabPanel";
import type { LoginMode } from "@/components/login/login-mode";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { ROUTES } from "@/lib/app-routes";
import { tenantNavigatePath } from "@/lib/tenant-path";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";

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
  const tenant = useOptionalHotelTenant();
  const loginMutation = useLogin();
  const tenantSlug = tenant?.slug ?? getHotelSlugFromPath() ?? undefined;

  const goTo = (path: string) => {
    if (tenant) {
      setLocation(tenantNavigatePath(tenant.slug, path));
      return;
    }
    setLocation(path.startsWith("/") ? path : `/${path}`);
  };

  const [mode, setMode] = useState<LoginMode>("guest");
  const [slideDirection, setSlideDirection] = useState(0);
  const [showGuestKey, setShowGuestKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();


  const managerForm = useForm<ManagerForm>({
    resolver: zodResolver(managerSchema),
    defaultValues: { email: "", password: "" },
  });

  const guestForm = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestKey: "" },
  });

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "manager") {
        goTo(ROUTES.manager);
      } else if (user.role === "personnel") {
        if (user.staffDepartment === "RESTAURANT") {
          goTo(ROUTES.restaurant);
        } else if (user.staffDepartment === "RECEPTION") {
          goTo(`${ROUTES.manager}?tab=guests`);
        } else {
          goTo(ROUTES.manager);
        }
      } else {
        goTo(ROUTES.guest);
      }
    }
  }, [isAuthenticated, user, setLocation, tenant]);

  // Switch tab and clean up stale state
  const switchMode = useCallback(
    (next: LoginMode) => {
      if (next === mode) return;
      setSlideDirection(getLoginSlideDirection(mode, next));
      setMode(next);
      setFormError(null);
      loginMutation.reset();
    },
    [mode, loginMutation],
  );

  // Show full-page loading while the session is being restored from token
  if (authLoading) {
    return (
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
      {
        data: {
          type: "guest",
          guestKey: data.guestKey.trim().toUpperCase(),
          ...(tenantSlug ? { hotelSlug: tenantSlug } : {}),
        } as { type: "guest"; guestKey: string },
      },
      {
        onSuccess: (res) => {
          setToken(res.token);
          markFreshGuestLogin();
          toast.success("Welcome to your stay");
          goTo(ROUTES.guest);
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
      {
        data: {
          type: "manager",
          email: data.email,
          password: data.password,
          ...(tenantSlug ? { hotelSlug: tenantSlug } : {}),
        } as { type: "manager"; email: string; password: string },
      },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast.success("Welcome back");
          const dept = res.user?.staffDepartment;
          const role = res.user?.role;
          if (role === "personnel" && dept === "RESTAURANT") goTo(ROUTES.restaurant);
          else if (role === "personnel" && dept === "RECEPTION") goTo(`${ROUTES.manager}?tab=guests`);
          else goTo(ROUTES.manager);
        },
        onError: (err) => {
          const msg = err.data?.error ?? "Sign-in failed. Please check your credentials.";
          setFormError(msg);
        },
      }
    );
  };



  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50/50 px-4 py-10 md:py-16">
      <motion.div
        className="w-full max-w-sm mx-auto space-y-8"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : PAGE_ENTER}
      >

        <motion.header
          className="text-center space-y-4"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { ...PAGE_ENTER, delay: 0.05 }}
        >
          <div className="flex flex-col items-center gap-5">
            <motion.div
              className="inline-flex items-center justify-center w-[88px] h-[88px] rounded-[28px] bg-white shadow-md shadow-zinc-200/60 border border-zinc-100/80"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : { type: "spring", stiffness: 420, damping: 28, delay: 0.08 }
              }
            >
              <GuestProLogo variant="login" />
            </motion.div>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-serif tracking-tight text-zinc-900">
                Guest Pro
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                A premium stay experience
              </p>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reduceMotion
              ? { duration: 0.01 }
              : { duration: 0.55, ease: IOS_EASE, delay: 0.12 }
          }
        >
        <Card className="border border-zinc-100 shadow-xl shadow-zinc-200/40 rounded-3xl bg-white">

          <div className="rounded-t-3xl border-b border-zinc-100 bg-zinc-50 px-2 pb-2 pt-2">
            <LoginModeSwitcher mode={mode} onModeChange={switchMode} />
          </div>

          <CardContent className="p-6 md:p-8">

            {/* Shared inline error banner */}
            <AnimatePresence initial={false}>
              {formError && (
                <motion.div
                  key="login-error"
                  role="alert"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.28, ease: IOS_EASE }}
                  className="flex items-start gap-3 overflow-hidden rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
                  <span>{formError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <LoginTabPanel mode={mode} slideDirection={slideDirection}>
            {mode === "guest" ? (
              <>
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
                                className="pl-12 pr-12 h-14 text-base rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 transition-all placeholder:text-zinc-400 font-mono tracking-widest"
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
              </>
            ) : (
              <div className="space-y-5">
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
                                className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 transition-all placeholder:text-zinc-400"
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
                                className="pl-12 pr-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 transition-all placeholder:text-zinc-400"
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
              </div>
            )}
            </LoginTabPanel>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
