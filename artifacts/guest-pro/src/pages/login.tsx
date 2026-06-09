/**
 * Legacy /login — redirects to dedicated guest login screen.
 */

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { ROUTES } from "@/lib/app-routes";

export default function LoginRedirect() {
  const navigate = useTenantNav();

  useEffect(() => {
    navigate(ROUTES.guestLogin);
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
    </div>
  );
}
