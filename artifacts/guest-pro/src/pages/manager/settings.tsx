/**
 * Manager Settings — /manager/settings
 *
 * Manager-only page. Contains the Active Tracking System configuration.
 * Staff (personnel) are redirected away — MANAGE_HOTEL permission required.
 *
 * Layout:
 *   sticky header → scrollable sections
 *     ├─ Active Tracking System card
 *     │    ├─ enable/disable toggle
 *     │    ├─ hotel location fields (lat/lng/radius)
 *     │    └─ save button
 *     └─ Allowed Networks card
 *          ├─ existing rules list with delete
 *          └─ add new rule form
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { can, Permission } from "@/lib/permissions";
import {
  getTrackingConfig,
  saveTrackingConfig,
  addTrackingNetwork,
  deleteTrackingNetwork,
  getMyIp,
  type TrackingConfig,
  type TrackingNetwork,
  type MyIpResponse,
} from "@/lib/tracking";
import { GuestProLogo } from "@/components/GuestProLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  MapPin,
  Wifi,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Eye,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 leading-snug">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm shadow-zinc-100/60 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-zinc-50 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Network rule row
// ---------------------------------------------------------------------------

function NetworkRow({
  network,
  onDelete,
  disabled,
}: {
  network: TrackingNetwork;
  onDelete: (id: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
        <Wifi className="w-3.5 h-3.5 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium text-zinc-800 truncate">
          {network.ipOrCidr}
        </p>
        {network.label && (
          <p className="text-[11px] text-zinc-400 truncate">{network.label}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(network.id)}
        disabled={disabled}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-40 transition-colors shrink-0"
        aria-label="Remove network rule"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Role guard
  useEffect(() => {
    if (user && !can(user.role, Permission.MANAGE_HOTEL)) {
      setLocation("/manager");
    }
  }, [user, setLocation]);

  // ── Tracking config state ─────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [networks, setNetworks] = useState<TrackingNetwork[]>([]);

  // Form fields
  const [isEnabled, setIsEnabled] = useState(false);
  const [centerLat, setCenterLat] = useState("");
  const [centerLng, setCenterLng] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("100");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── My IP diagnostics ─────────────────────────────────────────────────────

  const [myIpData, setMyIpData] = useState<MyIpResponse | null>(null);
  const [myIpLoading, setMyIpLoading] = useState(false);

  const loadMyIp = useCallback(async () => {
    setMyIpLoading(true);
    try {
      const data = await getMyIp();
      setMyIpData(data);
    } catch {
      toast.error("Failed to detect server-seen IP.");
    } finally {
      setMyIpLoading(false);
    }
  }, []);

  // Add network form
  const [newIpOrCidr, setNewIpOrCidr] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Load tracking config ──────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    try {
      const data = await getTrackingConfig();
      setConfig(data.config);
      setNetworks(data.networks);
      if (data.config) {
        setIsEnabled(data.config.isEnabled);
        setCenterLat(String(data.config.centerLat));
        setCenterLng(String(data.config.centerLng));
        setRadiusMeters(String(data.config.radiusMeters));
        setNotes(data.config.notes ?? "");
      }
    } catch {
      toast.error("Failed to load tracking configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ── Save tracking config ──────────────────────────────────────────────────

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);
    const radius = parseInt(radiusMeters, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setSaveError("Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setSaveError("Longitude must be between -180 and 180.");
      return;
    }
    if (isNaN(radius) || radius < 10 || radius > 50000) {
      setSaveError("Radius must be between 10 and 50 000 metres.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveTrackingConfig({
        isEnabled,
        centerLat: lat,
        centerLng: lng,
        radiusMeters: radius,
        notes,
      });
      setConfig(saved);
      toast.success("Tracking configuration saved.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Failed to save configuration.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Add network rule ──────────────────────────────────────────────────────

  const handleAddNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);

    const trimmed = newIpOrCidr.trim();
    if (!trimmed) {
      setNetworkError("Please enter an IP address or CIDR range.");
      return;
    }

    setAddingNetwork(true);
    try {
      const network = await addTrackingNetwork({
        ipOrCidr: trimmed,
        label: newLabel.trim(),
      });
      setNetworks((prev) => [...prev, network]);
      setNewIpOrCidr("");
      setNewLabel("");
      toast.success("Network rule added.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Invalid IP address or CIDR range.";
      setNetworkError(msg);
    } finally {
      setAddingNetwork(false);
    }
  };

  // ── Delete network rule ───────────────────────────────────────────────────

  const handleDeleteNetwork = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteTrackingNetwork(id);
      setNetworks((prev) => prev.filter((n) => n.id !== id));
      toast.success("Network rule removed.");
    } catch {
      toast.error("Failed to remove network rule.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user || !can(user.role, Permission.MANAGE_HOTEL)) return null;

  return (
    <div className="min-h-[100dvh] bg-zinc-50/60">
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-zinc-100/80 flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => setLocation("/manager")}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <GuestProLogo className="w-6 h-6 text-zinc-900" />
        <span className="text-sm font-semibold text-zinc-900 flex-1">Settings</span>
      </header>

      {/* ── Scrollable content ────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-16">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-zinc-300" />
          </div>
        ) : (
          <>
            {/* ─── Active Tracking System config card ─── */}
            <SectionCard
              icon={<Radio className="w-4 h-4 text-zinc-500" />}
              title="Active Tracking System"
              subtitle="Track guest presence using location and hotel network."
            >
              <form onSubmit={handleSaveConfig} className="space-y-5">
                {/* Enable / disable toggle */}
                <div className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      Tracking enabled
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Guests will be prompted for location permission.
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                    aria-label="Enable tracking"
                  />
                </div>

                {/* Hotel centre coordinates */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Hotel location
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Latitude"
                      hint="e.g. 41.0082"
                    >
                      <Input
                        type="number"
                        step="any"
                        value={centerLat}
                        onChange={(e) => setCenterLat(e.target.value)}
                        placeholder="41.0082"
                        className="rounded-xl h-10 text-sm font-mono"
                      />
                    </Field>
                    <Field
                      label="Longitude"
                      hint="e.g. 28.9784"
                    >
                      <Input
                        type="number"
                        step="any"
                        value={centerLng}
                        onChange={(e) => setCenterLng(e.target.value)}
                        placeholder="28.9784"
                        className="rounded-xl h-10 text-sm font-mono"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Radius (metres)"
                    hint="Guests within this radius are considered in-hotel. Default 100 m."
                  >
                    <Input
                      type="number"
                      step="1"
                      min="10"
                      max="50000"
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(e.target.value)}
                      placeholder="100"
                      className="rounded-xl h-10 text-sm"
                    />
                  </Field>
                </div>

                {/* Notes */}
                <Field
                  label="Notes (optional)"
                  hint="Internal notes about this tracking configuration."
                >
                  <Input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Updated after ISP change — June 2025"
                    className="rounded-xl h-10 text-sm"
                  />
                </Field>

                {/* Save error */}
                {saveError && (
                  <div className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Status indicator */}
                {config && !saveError && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Configuration saved</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : config ? (
                    "Update configuration"
                  ) : (
                    "Save configuration"
                  )}
                </Button>
              </form>
            </SectionCard>

            {/* ─── My IP diagnostics card ─── */}
            <SectionCard
              icon={<Eye className="w-4 h-4 text-zinc-500" />}
              title="Your Current IP"
              subtitle="Find out what IP the server sees from your connection — useful when adding your hotel network."
            >
              {myIpData ? (
                <div className="space-y-3">
                  <div className="bg-zinc-50 rounded-2xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Server-seen IP
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(myIpData.sourceIp).then(() =>
                            toast.success("IP copied to clipboard")
                          );
                        }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        aria-label="Copy IP"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-base font-mono font-semibold text-zinc-900">
                      {myIpData.sourceIp}
                    </p>
                  </div>
                  {myIpData.reqIps.length > 1 && (
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      All hops: {myIpData.reqIps.join(" → ")}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewIpOrCidr(myIpData.sourceIp);
                      toast.success("IP pre-filled in the Add Network form below.");
                    }}
                    className="w-full h-9 rounded-xl border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
                  >
                    Use this IP in Allowed Networks
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={loadMyIp}
                  disabled={myIpLoading}
                  variant="outline"
                  className="w-full h-10 rounded-2xl border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
                >
                  {myIpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1.5" />
                      Detect my IP
                    </>
                  )}
                </Button>
              )}
            </SectionCard>

            {/* ─── Allowed Networks card ─── */}
            <SectionCard
              icon={<Wifi className="w-4 h-4 text-zinc-500" />}
              title="Allowed Hotel Networks"
              subtitle="Add the hotel's public IP addresses or CIDR ranges. Guests connecting from these IPs are identified as being on the hotel network."
            >
              {/* Existing rules */}
              {networks.length > 0 ? (
                <div className="-mx-1">
                  {networks.map((n) => (
                    <NetworkRow
                      key={n.id}
                      network={n}
                      onDelete={handleDeleteNetwork}
                      disabled={deletingId === n.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-3">
                  No network rules yet. Add your hotel's public IP below.
                </p>
              )}

              {/* Add rule form */}
              <form onSubmit={handleAddNetwork} className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Add network rule
                  </span>
                </div>

                <Field
                  label="IP address or CIDR"
                  hint="Single IP: 203.0.113.5   Range: 203.0.113.0/24"
                >
                  <Input
                    type="text"
                    value={newIpOrCidr}
                    onChange={(e) => setNewIpOrCidr(e.target.value)}
                    placeholder="203.0.113.5 or 203.0.113.0/24"
                    className="rounded-xl h-10 text-sm font-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>

                <Field label="Label (optional)">
                  <Input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Main hotel WiFi"
                    className="rounded-xl h-10 text-sm"
                  />
                </Field>

                {networkError && (
                  <div className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                    <span>{networkError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={addingNetwork}
                  variant="outline"
                  className="w-full h-10 rounded-2xl border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
                >
                  {addingNetwork ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add rule
                    </>
                  )}
                </Button>
              </form>
            </SectionCard>
          </>
        )}
      </main>
    </div>
  );
}
