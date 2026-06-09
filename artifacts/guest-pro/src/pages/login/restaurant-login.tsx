import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { loginAsRestaurant } from "@/lib/auth-login";
import { getPostLoginPath } from "@/lib/post-login-redirect";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";
import { ROUTES } from "@/lib/app-routes";
import { HotelLoginShell } from "@/components/login/HotelLoginShell";
import { RevealToggle } from "@/components/login/RevealToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function RestaurantLoginPage() {
  const { user, isAuthenticated, setToken, isLoading: authLoading } = useAuth();
  const tenant = useOptionalHotelTenant();
  const navigate = useTenantNav();
  const tenantSlug = tenant?.slug ?? getHotelSlugFromPath() ?? undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const path = getPostLoginPath(user as Parameters<typeof getPostLoginPath>[0]);
      navigate(path);
    }
  }, [isAuthenticated, user, navigate]);

  const mutation = useMutation({
    mutationFn: ({ email, password }: FormValues) =>
      loginAsRestaurant(email, password, tenantSlug),
    onSuccess: (res) => {
      setToken(res.token);
      toast.success("Welcome");
      navigate(getPostLoginPath(res.user));
    },
    onError: (err: Error) => setFormError(err.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <HotelLoginShell
      title="Restaurant sign in"
      subtitle="Kitchen & room-service team — email and password"
      formError={formError}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => {
            setFormError(null);
            mutation.mutate(v);
          })}
          className="space-y-4"
          noValidate
          autoComplete="on"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <Input
                      placeholder="Email address"
                      type="email"
                      autoComplete="email"
                      className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <Input
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pl-12 pr-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200"
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
            type="submit"
            className="w-full h-14 rounded-2xl text-base font-medium shadow-md shadow-amber-900/10 bg-amber-600 hover:bg-amber-700"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Signing in…
              </>
            ) : (
              "Sign in to restaurant"
            )}
          </Button>
        </form>
      </Form>
      <p className="text-center text-xs text-zinc-400 mt-4">
        Hotel managers use{" "}
        <button
          type="button"
          className="underline underline-offset-2 hover:text-zinc-600"
          onClick={() => navigate(ROUTES.managerLogin)}
        >
          staff sign in
        </button>
        .
      </p>
    </HotelLoginShell>
  );
}
