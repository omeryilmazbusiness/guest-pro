import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IOS_EASE } from "@/lib/manager-motion";
import { COUNTRIES, countryFlag } from "@/lib/locale";
import { slugifyHotelName } from "@/lib/slugify";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import {
  absoluteAppHref,
  hotelGuestPath,
  hotelLoginPath,
  hotelManagerPath,
  sanitizeHotelSlug,
} from "@/lib/tenant-path";
import { HotelCardAvatar } from "@/components/platform/HotelCardAvatar";
import { HotelLogoUpload } from "@/components/platform/HotelLogoUpload";
import { dataUrlToJpegBlob } from "@/lib/hotel-logo";
import {
  createPlatformHotel,
  createPlatformHotelManager,
  uploadPlatformHotelLogo,
  type PlatformHotel,
} from "@/lib/platform-api";
import { PLAN_LABELS } from "@/lib/platform-plans";

const STEPS = [
  { id: 1, title: "Property", subtitle: "Name & location", icon: Building2 },
  { id: 2, title: "General manager", subtitle: "First admin account", icon: UserPlus },
  { id: 3, title: "Ready", subtitle: "Tenant live", icon: CheckCircle2 },
] as const;

const SELECTABLE_COUNTRIES = COUNTRIES.filter((c) => c.code !== "AB" && !c.name.startsWith("─"));

export interface PlatformAddHotelWizardProps {
  onFinished?: () => void;
}

export function PlatformAddHotelWizard({ onFinished }: PlatformAddHotelWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [countryCode, setCountryCode] = useState("TR");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [createdHotel, setCreatedHotel] = useState<PlatformHotel | null>(null);
  const [mgrFirst, setMgrFirst] = useState("");
  const [mgrLast, setMgrLast] = useState("");
  const [mgrEmail, setMgrEmail] = useState("");
  const [mgrPassword, setMgrPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<{
    hotel: PlatformHotel;
    managerEmail: string;
    managerPassword: string;
  } | null>(null);

  const generatedSlug = useMemo(() => slugifyHotelName(name) || "your-hotel", [name]);
  const countryName = useMemo(
    () => SELECTABLE_COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode,
    [countryCode],
  );

  const hotelSlug = sanitizeHotelSlug(createdHotel?.slug ?? generatedSlug);
  const loginPath = hotelLoginPath(hotelSlug);
  const loginHref = absoluteAppHref(loginPath);

  const reset = () => {
    setStep(1);
    setName("");
    setAddress("");
    setCountryCode("TR");
    setLogoPreview(null);
    setCreatedHotel(null);
    setMgrFirst("");
    setMgrLast("");
    setMgrEmail("");
    setMgrPassword("");
    setCompleted(null);
  };

  const onStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || address.trim().length < 3) {
      toast.error("Enter hotel name and full address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createPlatformHotel({
        name: name.trim(),
        address: address.trim(),
        countryCode: countryCode.toUpperCase(),
      });
      if (logoPreview) {
        const blob = await dataUrlToJpegBlob(logoPreview);
        await uploadPlatformHotelLogo(res.hotel.id, blob);
      }
      setCreatedHotel(res.hotel);
      setStep(2);
      toast.success("Property created");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create hotel");
    } finally {
      setSubmitting(false);
    }
  };

  const onStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdHotel) return;
    setSubmitting(true);
    try {
      const res = await createPlatformHotelManager(createdHotel.id, {
        email: mgrEmail,
        password: mgrPassword,
        firstName: mgrFirst,
        lastName: mgrLast,
      });
      setCompleted({
        hotel: createdHotel,
        managerEmail: res.manager.email,
        managerPassword: mgrPassword,
      });
      setStep(3);
      toast.success("Onboarding complete");
      await queryClient.invalidateQueries({ queryKey: ["platform-hotels"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create manager");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLogin = () => {
    void navigator.clipboard.writeText(loginHref);
    toast.success("Login URL copied");
  };

  const copyText = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/80 to-white px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-zinc-900">Onboard new hotel</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Property first, then general manager — slug is assigned automatically.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {STEPS.map((s) => {
            const active = step === s.id;
            const done = step > s.id;
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`flex flex-1 flex-col gap-0.5 rounded-xl px-2 py-2 transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : done
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-white text-zinc-400 ring-1 ring-zinc-100"
                }`}
              >
                <Icon className="mx-auto h-4 w-4" />
                <span className="text-center text-[10px] font-semibold leading-tight sm:text-[11px]">
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="s1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: IOS_EASE }}
              onSubmit={onStep1}
              className="space-y-6"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Logo
                  </Label>
                  <HotelLogoUpload value={logoPreview} onChange={setLogoPreview} hotelName={name} />
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-name">Hotel name</Label>
                    <Input
                      id="ob-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ramada Arn"
                      className="h-11 rounded-xl"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-address" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      Full address
                    </Label>
                    <Textarea
                      id="ob-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, building, district, city, postal code"
                      className="min-h-[108px] resize-none rounded-xl text-sm leading-relaxed"
                      required
                    />
                    <p className="text-xs text-zinc-500">Shown on the property card and guest-facing materials.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-country">Country</Label>
                    <select
                      id="ob-country"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                      required
                    >
                      {SELECTABLE_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {countryFlag(c.code)} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {name.trim() && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Card preview
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="flex gap-4 p-4">
                      <HotelCardAvatar name={name} slug={generatedSlug} logoUrl={logoPreview} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-base font-semibold text-zinc-900">{name.trim()}</span>
                          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Live
                          </span>
                          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {PLAN_LABELS.starter}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-xs text-zinc-400">/{generatedSlug}</p>
                        {address.trim() && (
                          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                            {countryFlag(countryCode)} {address.trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-3 text-xs text-zinc-600">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-800">Tenant URL (auto)</p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-600">/{generatedSlug}/login</p>
                  <p className="mt-1 text-zinc-500">
                    Slug is generated from the hotel name. You can change it later in hotel settings.
                  </p>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create property
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>
          )}

          {step === 2 && createdHotel && (
            <motion.form
              key="s2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: IOS_EASE }}
              onSubmit={onStep2}
              className="space-y-5"
            >
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm">
                <p className="font-medium text-emerald-900">{createdHotel.name}</p>
                <p className="text-emerald-800/80">
                  {countryFlag(createdHotel.countryCode ?? countryCode)}{" "}
                  {countryName} · <span className="font-mono text-xs">/{createdHotel.slug}</span>
                </p>
              </div>

              <p className="text-sm text-zinc-600">
                Create the general manager who will run day-to-day operations at this property.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input value={mgrFirst} onChange={(e) => setMgrFirst(e.target.value)} className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input value={mgrLast} onChange={(e) => setMgrLast(e.target.value)} className="h-11 rounded-xl" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Work email</Label>
                <Input
                  type="email"
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="ob-mgr-password">Temporary password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg px-2 text-xs text-zinc-600"
                    onClick={() => setMgrPassword(generateTemporaryPassword())}
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Generate
                  </Button>
                </div>
                <Input
                  id="ob-mgr-password"
                  type="text"
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="h-11 rounded-xl font-mono text-sm tracking-wide"
                  minLength={8}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-zinc-500">
                  Enter your own password (visible). Use Generate only if you want a random one.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="h-11 flex-[2] rounded-xl" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish onboarding"}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 3 && completed && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-zinc-900">All set</h3>
                <p className="mt-1 text-sm text-zinc-500">{completed.hotel.name}</p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-left text-sm">
                <p className="font-medium text-zinc-800">General manager credentials</p>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-xs text-zinc-500">Email</dt>
                    <dd className="flex items-center justify-between gap-2 font-mono text-xs text-zinc-800">
                      <span className="truncate">{completed.managerEmail}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 rounded-lg px-2"
                        onClick={() => copyText(completed.managerEmail, "Email")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Temporary password</dt>
                    <dd className="flex items-center justify-between gap-2 font-mono text-xs text-zinc-800">
                      <span className="truncate">{completed.managerPassword}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 rounded-lg px-2"
                        onClick={() => copyText(completed.managerPassword, "Password")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={loginHref}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Open manager login
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <Button type="button" variant="outline" className="rounded-xl" onClick={copyLogin}>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy URL
                </Button>
              </div>
              <p className="font-mono text-xs text-zinc-400">{loginPath}</p>
              <div className="flex justify-center gap-3 text-xs">
                <a href={absoluteAppHref(hotelManagerPath(completed.hotel.slug))} className="text-zinc-600 underline">
                  Manager app
                </a>
                <a href={absoluteAppHref(hotelGuestPath(completed.hotel.slug))} className="text-zinc-600 underline">
                  Guest app
                </a>
              </div>
              <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={() => { reset(); onFinished?.(); }}>
                Onboard another hotel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
