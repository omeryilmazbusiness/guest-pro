import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES, countryFlag } from "@/lib/locale";
import { hotelLoginPath } from "@/lib/tenant-path";
import { HOTEL_PLAN_TIERS, PLAN_LABELS, type HotelPlanTier } from "@/lib/platform-plans";
import { HotelLogoUpload } from "@/components/platform/HotelLogoUpload";
import { PlatformHotelAiSection } from "@/components/platform/PlatformHotelAiSection";
import { dataUrlToJpegBlob, getHotelLogoSrc } from "@/lib/hotel-logo";
import {
  deletePlatformHotel,
  deletePlatformHotelLogo,
  updatePlatformHotel,
  uploadPlatformHotelLogo,
  type PlatformHotel,
} from "@/lib/platform-api";

const SELECTABLE_COUNTRIES = COUNTRIES.filter((c) => c.code !== "AB" && !c.name.startsWith("─"));

export function PlatformHotelManageSheet({
  hotel,
  open,
  onOpenChange,
  initialPanel = "default",
}: {
  hotel: PlatformHotel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Open directly on delete confirmation */
  initialPanel?: "default" | "delete";
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [countryCode, setCountryCode] = useState("TR");
  const [slug, setSlug] = useState("");
  const [planTier, setPlanTier] = useState<HotelPlanTier>("starter");
  const [renewsAt, setRenewsAt] = useState("");
  const [platformNotes, setPlatformNotes] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoCleared, setLogoCleared] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!hotel) return;
    setName(hotel.name);
    setAddress(hotel.address ?? "");
    setCountryCode(hotel.countryCode ?? "TR");
    setSlug(hotel.slug);
    setPlanTier(hotel.planTier ?? "starter");
    setRenewsAt(hotel.subscriptionRenewsAt?.slice(0, 10) ?? "");
    setPlatformNotes(hotel.platformNotes ?? "");
    setLogoPreview(null);
    setLogoCleared(false);
    setConfirmDelete("");
    setShowDelete(initialPanel === "delete");
  }, [hotel, open, initialPanel]);

  if (!hotel) return null;

  const displayLogo =
    logoPreview ??
    (!logoCleared ? getHotelLogoSrc(slug || hotel.slug, hotel.logoUrl, hotel.updatedAt) : null);

  const onSave = async () => {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length > 0 && trimmedAddress.length < 3) {
      toast.error("Address must be at least 3 characters, or leave it empty.");
      return;
    }
    setSaving(true);
    try {
      const newSlug = slug.trim().toLowerCase();
      await updatePlatformHotel(hotel.id, {
        name: name.trim(),
        address: trimmedAddress.length > 0 ? trimmedAddress : null,
        countryCode: countryCode.toUpperCase(),
        slug: newSlug !== hotel.slug ? newSlug : undefined,
        planTier,
        subscriptionRenewsAt: renewsAt || null,
        platformNotes: platformNotes.trim() || null,
      });
      if (logoPreview) {
        const blob = await dataUrlToJpegBlob(logoPreview);
        await uploadPlatformHotelLogo(hotel.id, blob);
      } else if (logoCleared && hotel.logoUrl) {
        await deletePlatformHotelLogo(hotel.id);
      }
      toast.success("Hotel updated");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
      await queryClient.invalidateQueries({ queryKey: ["platform-track"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async () => {
    setSaving(true);
    try {
      await updatePlatformHotel(hotel.id, { isActive: !hotel.isActive });
      toast.success(hotel.isActive ? "Hotel deactivated" : "Hotel activated");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
      await queryClient.invalidateQueries({ queryKey: ["platform-track"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deletePlatformHotel(hotel.id, confirmDelete);
      toast.success("Hotel permanently deleted");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
      await queryClient.invalidateQueries({ queryKey: ["platform-track"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Manage hotel</DialogTitle>
          <DialogDescription>
            Update property details, deactivate access, or permanently remove this tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-4">
            <HotelLogoUpload
              value={displayLogo}
              onChange={(url) => {
                setLogoPreview(url);
                setLogoCleared(url === null);
              }}
              hotelName={name}
            />
            <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (optional)</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Leave empty if not set yet"
              className="min-h-[72px] resize-none rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
            >
              {SELECTABLE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryFlag(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>URL slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="rounded-xl font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              Login: <span className="font-mono">{hotelLoginPath(slug || hotel.slug)}</span>
            </p>
          </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Package</Label>
              <select
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value as HotelPlanTier)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
              >
                {HOTEL_PLAN_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {PLAN_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Renewal date</Label>
              <Input
                type="date"
                value={renewsAt}
                onChange={(e) => setRenewsAt(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Internal notes</Label>
            <Textarea
              value={platformNotes}
              onChange={(e) => setPlatformNotes(e.target.value)}
              className="min-h-[64px] resize-none rounded-xl"
            />
          </div>

          <PlatformHotelAiSection hotel={hotel} />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={saving}
              onClick={() => void onToggleActive()}
            >
              {hotel.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button type="button" className="flex-1 rounded-xl" disabled={saving} onClick={() => void onSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>

          {!showDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete hotel permanently…
            </Button>
          ) : (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-3">
              <p className="text-sm text-red-800">
                This removes the hotel, all staff, guests, and data. Type{" "}
                <strong className="font-mono">{hotel.slug}</strong> to confirm.
              </p>
              <Input
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={hotel.slug}
                className="rounded-xl font-mono"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDelete(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  disabled={deleting || confirmDelete.trim().toLowerCase() !== hotel.slug}
                  onClick={() => void onDelete()}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete forever"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
