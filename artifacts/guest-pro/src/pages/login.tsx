import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogin, useGetGoogleAuthStatus } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, KeyRound, Mail, Lock, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const managerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const guestSchema = z.object({
  guestKey: z.string().min(1, "Guest key is required"),
});

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in is not yet configured for this instance.",
  google_denied: "Google sign-in was cancelled.",
  google_invalid_state: "OAuth state mismatch. Please try again.",
  google_no_code: "No authorization code received from Google.",
  google_profile_failed: "Could not retrieve your Google profile.",
  google_no_hotel: "No hotel account found. Please contact your administrator.",
  google_server_error: "A server error occurred during Google sign-in. Please try again.",
};

export default function Login() {
  const { user, isAuthenticated, setToken, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const [mode, setMode] = useState<"guest" | "manager">("guest");
  const { data: googleStatus } = useGetGoogleAuthStatus();

  const managerForm = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
    defaultValues: { email: "", password: "" },
  });

  const guestForm = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestKey: "" },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleCode = params.get("google_code");
    const error = params.get("error");

    // Clean URL immediately regardless of outcome
    if (googleCode || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (googleCode) {
      // Exchange the short-lived code for the real token server-side
      fetch(`/api/auth/google/exchange?code=${encodeURIComponent(googleCode)}`)
        .then((r) => r.json())
        .then((data: { token?: string; error?: string }) => {
          if (data.token) {
            setToken(data.token);
            toast.success("Signed in with Google");
            setLocation("/manager");
          } else {
            toast.error(data.error ?? "Google sign-in failed. Please try again.");
          }
        })
        .catch(() => {
          toast.error("Google sign-in failed. Please try again.");
        });
      return;
    }

    if (error) {
      const message = GOOGLE_ERROR_MESSAGES[error] ?? "An error occurred. Please try again.";
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "manager") {
        setLocation("/manager");
      } else {
        setLocation("/guest");
      }
    }
  }, [isAuthenticated, user, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const onSubmitManager = (data: z.infer<typeof managerSchema>) => {
    loginMutation.mutate(
      { data: { type: "manager", email: data.email, password: data.password } },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast.success("Welcome back");
          setLocation("/manager");
        },
        onError: (err) => {
          toast.error(err.data?.error || "Login failed");
        },
      }
    );
  };

  const onSubmitGuest = (data: z.infer<typeof guestSchema>) => {
    loginMutation.mutate(
      { data: { type: "guest", guestKey: data.guestKey } },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast.success("Welcome to your stay");
          setLocation("/guest");
        },
        onError: (err) => {
          toast.error(err.data?.error || "Invalid guest key");
        },
      }
    );
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50/50 p-4 md:p-8">
      <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-zinc-100 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-900" />
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-zinc-900">Guest Pro</h1>
          <p className="text-zinc-500 font-medium">A premium stay experience</p>
        </div>

        <Card className="border border-zinc-100 shadow-xl shadow-zinc-200/50 rounded-3xl bg-white">
          <div className="flex p-2 bg-zinc-50 rounded-t-3xl border-b border-zinc-100">
            <button
              data-testid="tab-guest"
              type="button"
              onClick={() => setMode("guest")}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
                mode === "guest"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Guest Key
            </button>
            <button
              data-testid="tab-manager"
              type="button"
              onClick={() => setMode("manager")}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
                mode === "manager"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Staff
            </button>
          </div>

          <CardContent className="p-8">
            {mode === "guest" ? (
              <Form {...guestForm}>
                <form onSubmit={guestForm.handleSubmit(onSubmitGuest)} className="space-y-6">
                  <FormField
                    control={guestForm.control}
                    name="guestKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                            <Input
                              data-testid="input-guest-key"
                              placeholder="Enter your guest key"
                              type="password"
                              autoComplete="off"
                              className="pl-12 h-14 text-lg rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
                              {...field}
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
                    className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg shadow-zinc-900/20"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Access your stay"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-5">
                <Form {...managerForm}>
                  <form
                    onSubmit={managerForm.handleSubmit(onSubmitManager)}
                    className="space-y-4"
                    autoComplete="off"
                  >
                    <FormField
                      control={managerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                              <Input
                                data-testid="input-email"
                                placeholder="Email address"
                                type="email"
                                autoComplete="email"
                                className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
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
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                              <Input
                                data-testid="input-password"
                                placeholder="Password"
                                type="password"
                                autoComplete="current-password"
                                className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
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
                      className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg shadow-zinc-900/20"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </Form>

                {googleStatus?.configured !== false && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-100" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-zinc-400 font-medium">or</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-14 rounded-2xl text-base font-medium border-zinc-200 hover:bg-zinc-50 transition-all"
                      onClick={handleGoogleSignIn}
                      disabled={loginMutation.isPending}
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                      Continue with Google
                    </Button>

                    {!googleStatus?.configured && (
                      <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Google sign-in requires AUTH_GOOGLE_CLIENT_ID and AUTH_GOOGLE_CLIENT_SECRET
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
