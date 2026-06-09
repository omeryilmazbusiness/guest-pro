import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { markFreshGuestLogin } from "@/hooks/use-install-prompt";
import { loginAsGuest } from "@/lib/auth-login";
import { getPostLoginPath } from "@/lib/post-login-redirect";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";
import { HotelLoginShell } from "@/components/login/HotelLoginShell";
import { RevealToggle } from "@/components/login/RevealToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const schema = z.object({
  guestKey: z.string().min(1, "Please enter your guest key"),
});

type FormValues = z.infer<typeof schema>;

export default function GuestLoginPage() {
  const { user, isAuthenticated, setToken, isLoading: authLoading } = useAuth();
  const tenant = useOptionalHotelTenant();
  const navigate = useTenantNav();
  const tenantSlug = tenant?.slug ?? getHotelSlugFromPath() ?? undefined;
  const [showKey, setShowKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { guestKey: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginPath(user as Parameters<typeof getPostLoginPath>[0]));
    }
  }, [isAuthenticated, user, navigate]);

  const mutation = useMutation({
    mutationFn: (guestKey: string) => loginAsGuest(guestKey, tenantSlug),
    onSuccess: (res) => {
      setToken(res.token);
      markFreshGuestLogin();
      toast.success("Welcome to your stay");
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
      title="Guest Pro"
      subtitle="Enter your guest key to access your stay"
      formError={formError}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => {
            setFormError(null);
            mutation.mutate(v.guestKey);
          })}
          className="space-y-5"
          noValidate
        >
          <FormField
            control={form.control}
            name="guestKey"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <Input
                      data-testid="input-guest-key"
                      placeholder="Enter your guest key"
                      type={showKey ? "text" : "password"}
                      autoComplete="off"
                      className="pl-12 pr-12 h-14 text-base rounded-2xl bg-zinc-50 border-zinc-200 font-mono tracking-widest"
                      {...field}
                    />
                    <RevealToggle
                      revealed={showKey}
                      onToggle={() => setShowKey((p) => !p)}
                      label={showKey ? "Hide guest key" : "Show guest key"}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl text-base font-medium shadow-md shadow-zinc-900/15"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
      </p>
    </HotelLoginShell>
  );
}
