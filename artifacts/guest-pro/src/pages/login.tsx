import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, KeyRound, Mail, Lock, LogIn, ChevronRight } from "lucide-react";
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

export default function Login() {
  const { user, isAuthenticated, setToken, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const [mode, setMode] = useState<"guest" | "manager">("guest");

  const managerForm = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
    defaultValues: { email: "", password: "" },
  });

  const guestForm = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestKey: "" },
  });

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
    loginMutation.mutate({
      data: { type: "manager", email: data.email, password: data.password }
    }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast.success("Welcome back");
        setLocation("/manager");
      },
      onError: (err) => {
        toast.error(err.data?.error || "Login failed");
      }
    });
  };

  const onSubmitGuest = (data: z.infer<typeof guestSchema>) => {
    loginMutation.mutate({
      data: { type: "guest", guestKey: data.guestKey }
    }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast.success("Welcome to your stay");
        setLocation("/guest");
      },
      onError: (err) => {
        toast.error(err.data?.error || "Invalid guest key");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50/50 p-4 md:p-8">
      <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-zinc-100 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-900" />
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-zinc-900">Guest Pro</h1>
          <p className="text-zinc-500 font-medium">A premium stay experience</p>
        </div>

        <Card className="border-0 shadow-xl shadow-zinc-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <div className="flex p-2 bg-zinc-100/50 rounded-t-3xl border-b border-zinc-100">
            <button
              data-testid="tab-guest"
              onClick={() => setMode("guest")}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${mode === "guest" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Guest Key
            </button>
            <button
              data-testid="tab-manager"
              onClick={() => setMode("manager")}
              className={`flex-1 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${mode === "manager" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
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
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <Input
                              data-testid="input-guest-key"
                              placeholder="Enter your guest key"
                              type="password"
                              className="pl-12 h-14 text-lg rounded-2xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
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
                    {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access your stay"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...managerForm}>
                <form onSubmit={managerForm.handleSubmit(onSubmitManager)} className="space-y-5">
                  <FormField
                    control={managerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <Input
                              data-testid="input-email"
                              placeholder="Email address"
                              type="email"
                              className="pl-12 h-14 rounded-2xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
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
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <Input
                              data-testid="input-password"
                              placeholder="Password"
                              type="password"
                              className="pl-12 h-14 rounded-2xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 transition-all placeholder:text-zinc-400"
                              {...field}
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
                    {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
