/**
 * Deep-link route: /manager/guests/new
 * Opens the create-guest sheet on top of a minimal shell, then returns to dashboard.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/app-routes";
import { useAuth } from "@/hooks/use-auth";
import { isStaffRole } from "@/lib/permissions";
import { CreateGuestSheet } from "@/components/manager/CreateGuestSheet";

export default function CreateGuest() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation(ROUTES.managerLogin);
    else if (user && !isStaffRole(user.role)) setLocation("/guest");
  }, [isAuthenticated, user, setLocation]);

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  return (
    <div className="min-h-dvh bg-zinc-50/60">
      <CreateGuestSheet open onClose={() => setLocation("/manager")} />
    </div>
  );
}
