import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { absoluteAppHref, hotelLoginPath } from "@/lib/tenant-path";
import {
  createPlatformHotelManager,
  listPlatformHotelManagers,
  resetPlatformManagerPassword,
  type PlatformHotel,
} from "@/lib/platform-api";
import { generateTemporaryPassword } from "@/lib/temporary-password";

export function PlatformManagerEditSheet({
  hotel,
  open,
  onOpenChange,
}: {
  hotel: PlatformHotel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrFirst, setMgrFirst] = useState("");
  const [mgrLast, setMgrLast] = useState("");
  const [mgrPassword, setMgrPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["platform-managers", hotel?.id],
    queryFn: () => listPlatformHotelManagers(hotel!.id),
    enabled: open && !!hotel,
  });

  const managers = data?.managers ?? [];
  const gm = managers.find((m) => m.role === "manager") ?? managers[0];

  useEffect(() => {
    if (!open) {
      setNewPassword("");
      setMgrEmail("");
      setMgrFirst("");
      setMgrLast("");
      setMgrPassword("");
    }
  }, [open]);

  if (!hotel) return null;

  const onResetPassword = async () => {
    if (!gm || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setResetting(true);
    try {
      await resetPlatformManagerPassword(hotel.id, gm.id, newPassword);
      toast.success("Manager password updated");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const onCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createPlatformHotelManager(hotel.id, {
        email: mgrEmail,
        password: mgrPassword,
        firstName: mgrFirst,
        lastName: mgrLast,
      });
      toast.success(`Manager created: ${res.manager.email}`);
      await queryClient.invalidateQueries({ queryKey: ["platform-managers", hotel.id] });
      await queryClient.invalidateQueries({ queryKey: ["platform-track"] });
      setMgrEmail("");
      setMgrFirst("");
      setMgrLast("");
      setMgrPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create manager");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">General manager</DialogTitle>
          <DialogDescription>
            {hotel.name} ·{" "}
            <a
              href={absoluteAppHref(hotelLoginPath(hotel.slug))}
              className="font-mono text-zinc-700 underline"
              target="_blank"
              rel="noreferrer"
            >
              /{hotel.slug}/login
            </a>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : gm ? (
          <div className="space-y-4 pt-1">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
              <p className="text-sm font-medium text-zinc-900">
                {gm.firstName} {gm.lastName}
              </p>
              <p className="mt-0.5 text-sm text-zinc-600">{gm.email}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {gm.isActive ? "Active account" : "Inactive"} · joined{" "}
                {new Date(gm.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gm-new-pw">New password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2 text-xs"
                  onClick={() => setNewPassword(generateTemporaryPassword())}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Generate
                </Button>
              </div>
              <Input
                id="gm-new-pw"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl font-mono text-sm"
                minLength={8}
                spellCheck={false}
              />
            </div>
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={resetting || newPassword.length < 8}
              onClick={() => void onResetPassword()}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save new password"}
            </Button>
          </div>
        ) : (
          <form onSubmit={onCreateManager} className="space-y-4 pt-1">
            <p className="text-sm text-zinc-500">No general manager yet. Create one below.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={mgrFirst} onChange={(e) => setMgrFirst(e.target.value)} className="rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={mgrLast} onChange={(e) => setMgrLast(e.target.value)} className="rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={mgrEmail} onChange={(e) => setMgrEmail(e.target.value)} className="rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2 text-xs"
                  onClick={() => setMgrPassword(generateTemporaryPassword())}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Generate
                </Button>
              </div>
              <Input
                type="text"
                value={mgrPassword}
                onChange={(e) => setMgrPassword(e.target.value)}
                className="rounded-xl font-mono text-sm"
                minLength={8}
                required
                spellCheck={false}
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Create manager
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
