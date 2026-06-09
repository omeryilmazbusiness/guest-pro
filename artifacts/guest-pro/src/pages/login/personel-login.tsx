import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { ROUTES } from "@/lib/app-routes";
import { loginAsEmployee } from "@/lib/auth-login";
import { getPostLoginPath } from "@/lib/post-login-redirect";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";
import { HotelLoginShell } from "@/components/login/HotelLoginShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const schema = z.object({
  employeeNumber: z.string().regex(/^\d{4}$/, "Enter your 4-digit employee number"),
});

type FormValues = z.infer<typeof schema>;

export default function PersonelLoginPage() {
  const { user, isAuthenticated, setToken, isLoading: authLoading } = useAuth();
  const tenant = useOptionalHotelTenant();
  const navigate = useTenantNav();
  const tenantSlug = tenant?.slug ?? getHotelSlugFromPath() ?? undefined;
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeNumber: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginPath(user as Parameters<typeof getPostLoginPath>[0]));
    }
  }, [isAuthenticated, user, navigate]);

  const mutation = useMutation({
    mutationFn: (employeeNumber: string) => {
      if (!tenantSlug) throw new Error("Hotel context is required.");
      return loginAsEmployee(employeeNumber, tenantSlug);
    },
    onSuccess: (res) => {
      setToken(res.token);
      toast.success("Welcome");
      navigate(ROUTES.staff);
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
      title="Employee tasks"
      subtitle="Enter your 4-digit employee number"
      formError={formError}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => {
            setFormError(null);
            mutation.mutate(v.employeeNumber);
          })}
          className="space-y-5"
          noValidate
        >
          <FormField
            control={form.control}
            name="employeeNumber"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <Input
                      data-testid="input-employee-number"
                      placeholder="0000"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="off"
                      className="pl-12 h-14 text-center text-2xl rounded-2xl bg-zinc-50 border-zinc-200 font-mono tracking-[0.4em]"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
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
            disabled={mutation.isPending || !tenantSlug}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading tasks…
              </>
            ) : (
              "Get my tasks"
            )}
          </Button>
        </form>
      </Form>
      <p className="text-center text-xs text-zinc-400 leading-relaxed mt-4">
        View and complete today&apos;s assigned tasks.
      </p>
    </HotelLoginShell>
  );
}
