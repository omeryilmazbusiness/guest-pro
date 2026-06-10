/**
 * CreateGuestSheet — centered premium popup to check in a new guest.
 */

import { useMemo, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserRound,
  Loader2,
  Globe,
  DoorOpen,
  CalendarDays,
  ChevronsUpDown,
  Check,
  ScanLine,
} from "lucide-react";
import { useHotelWifiNetworks } from "@/hooks/use-hotel-wifi-networks";
import { WifiNetworkSelectField } from "@/components/manager/WifiNetworkSelectField";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { useCreateGuest, getListGuestsQueryKey } from "@workspace/api-client-react";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import { GuestHandoffModal, type HandoffData } from "@/components/GuestHandoffModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { COUNTRIES, countryFlag } from "@/lib/locale";
import { todayIso, minCheckOutDate } from "@/lib/stays";
import { useQrScannerGun } from "@/hooks/use-qr-scanner-gun";
import { alpha3ToAlpha2 } from "@/lib/passport/nationality-map";
import type { PassportData } from "@/lib/passport/types";

function buildGuestSchema(t: StaffTranslations, wifiRequired: boolean) {
  return z
    .object({
      firstName: z.string().min(1, t.guestFirstNameRequired),
      lastName: z.string().min(1, t.guestLastNameRequired),
      roomNumber: z.string().min(1, t.guestRoomRequired),
      countryCode: z.string().min(2, t.guestCountryRequired),
      checkInDate: z.string().optional(),
      checkOutDate: z.string().optional(),
      wifiNetworkId: wifiRequired
        ? z.number({ message: t.guestWifiNetworkRequired })
        : z.number().optional(),
    })
    .refine(
      (d) => {
        if (d.checkInDate && d.checkOutDate) return d.checkOutDate > d.checkInDate;
        return true;
      },
      { message: t.checkoutAfterCheckin, path: ["checkOutDate"] },
    );
}

type GuestFormValues = z.infer<ReturnType<typeof buildGuestSchema>>;

const fieldClass =
  "h-9 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-zinc-900";
const dateClass =
  "h-9 w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900";
const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-zinc-400";

export interface CreateGuestSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateGuestSheet({ open, onClose, onCreated }: CreateGuestSheetProps) {
  const { t } = useStaffLocale();
  const queryClient = useQueryClient();
  const createGuestMutation = useCreateGuest();
  const { data: wifiNetworks = [], isLoading: wifiNetworksLoading } = useHotelWifiNetworks(open);
  const wifiRequired = wifiNetworks.length > 0;
  const schema = useMemo(() => buildGuestSchema(t, wifiRequired), [t, wifiRequired]);
  const today = todayIso();

  const [countryOpen, setCountryOpen] = useState(false);
  const [scannerFilled, setScannerFilled] = useState(false);
  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      roomNumber: "",
      countryCode: "",
      checkInDate: today,
      checkOutDate: "",
      wifiNetworkId: undefined,
    },
  });

  const selectedCountry = form.watch("countryCode");
  const watchedCheckIn = form.watch("checkInDate");

  useEffect(() => {
    if (!open) return;
    setScannerFilled(false);
    setCountryOpen(false);
    form.reset({
      firstName: "",
      lastName: "",
      roomNumber: "",
      countryCode: "",
      checkInDate: today,
      checkOutDate: "",
      wifiNetworkId: undefined,
    });
  }, [open, form, today]);

  const handleScan = useCallback(
    (data: PassportData) => {
      const alpha2 = alpha3ToAlpha2(data.nationality);
      form.setValue("firstName", data.firstName, { shouldValidate: true });
      form.setValue("lastName", data.lastName, { shouldValidate: true });
      if (alpha2) form.setValue("countryCode", alpha2, { shouldValidate: true });
      setScannerFilled(true);
      toast.success(t.passportScanned, {
        description: alpha2 ? undefined : t.passportNationalityManual,
        duration: 4000,
      });
    },
    [form, t],
  );

  const handleScanError = useCallback(() => {
    toast.error(t.passportQrError);
  }, [t]);

  useQrScannerGun({
    onScan: handleScan,
    onError: handleScanError,
    enabled: open && !handoffOpen,
  });

  function handleClose() {
    if (createGuestMutation.isPending) return;
    form.reset();
    onClose();
  }

  function onSubmit(data: GuestFormValues) {
    if (wifiRequired && !data.wifiNetworkId) {
      form.setError("wifiNetworkId", { message: t.guestWifiNetworkRequired });
      return;
    }
    createGuestMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
          onCreated?.();
          toast.success(t.guestCreatedSuccess);
          setScannerFilled(false);
          setHandoff({
            firstName: res.guest.firstName,
            lastName: res.guest.lastName,
            roomNumber: res.guest.roomNumber,
            guestKey: res.guestKey,
            qrLoginUrl: res.qrLoginUrl,
            qrTokenExpiresAt: res.qrTokenExpiresAt,
          });
          setHandoffOpen(true);
        },
        onError: (err) => {
          toast.error(err.data?.error ?? t.failedCreateGuest);
        },
      },
    );
  }

  function handleCreateAnother() {
    setHandoffOpen(false);
    setHandoff(null);
    setScannerFilled(false);
    form.reset({
      firstName: "",
      lastName: "",
      roomNumber: "",
      countryCode: "",
      checkInDate: today,
      checkOutDate: "",
      wifiNetworkId: undefined,
    });
  }

  return (
    <>
      <ManagerCenterSheet
        open={open && !handoffOpen}
        onClose={handleClose}
        ariaLabel={t.newGuest}
        closeLabel={t.cancel}
        className="max-w-[min(100%,24rem)]"
      >
        <div className="flex max-h-[min(88dvh,38rem)] flex-col">
          <div className="border-b border-zinc-100 px-5 pb-3 pt-5 pr-12">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <UserRound className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">
                  {t.newGuest}
                </h2>
                <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
                  {t.addGuestSubtitle}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/80 px-2.5 py-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <ScanLine className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-500">{t.scannerReadyShort}</span>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-3">
                {scannerFilled && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="text-[11px] font-medium leading-snug text-emerald-800">
                      {t.passportScannedHint}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>{t.staffFirstName}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-first-name"
                            placeholder="Jane"
                            autoComplete="given-name"
                            className={fieldClass}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>{t.staffLastName}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-last-name"
                            placeholder="Doe"
                            autoComplete="family-name"
                            className={fieldClass}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>{t.guestRoomNumber}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DoorOpen className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                          <Input
                            data-testid="input-room-number"
                            placeholder="402"
                            className={cn(fieldClass, "pl-9 font-mono")}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {wifiRequired && (
                  <FormField
                    control={form.control}
                    name="wifiNetworkId"
                    render={({ field }) => (
                      <WifiNetworkSelectField
                        label={t.guestWifiNetwork}
                        placeholder={t.guestWifiNetworkPlaceholder}
                        emptyLabel={t.guestWifiNetworkEmpty}
                        value={field.value}
                        onChange={field.onChange}
                        networks={wifiNetworks}
                        loading={wifiNetworksLoading}
                        labelClassName={labelClass}
                      />
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>{t.guestCountry}</FormLabel>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              data-testid="input-country"
                              role="combobox"
                              aria-expanded={countryOpen}
                              className={cn(
                                "flex h-9 w-full items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 text-sm transition-colors",
                                field.value ? "text-zinc-900" : "text-zinc-400",
                              )}
                            >
                              {field.value ? (
                                <>
                                  <span className="text-base leading-none">
                                    {countryFlag(field.value)}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-left font-medium">
                                    {COUNTRIES.find((c) => c.code === field.value)?.name ??
                                      field.value}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Globe className="h-3.5 w-3.5 shrink-0" />
                                  <span className="flex-1 text-left">{t.guestCountry}</span>
                                </>
                              )}
                              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="z-[130] w-[var(--radix-popover-trigger-width)] rounded-xl border-zinc-100 p-0 shadow-xl"
                          align="start"
                          sideOffset={4}
                        >
                          <Command>
                            <CommandInput
                              placeholder={t.guestCountrySearch}
                              className="h-9 border-0 text-sm"
                            />
                            <CommandList className="max-h-48">
                              <CommandEmpty className="py-4 text-center text-xs text-zinc-400">
                                {t.guestCountryEmpty}
                              </CommandEmpty>
                              <CommandGroup>
                                {COUNTRIES.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() => {
                                      form.setValue("countryCode", country.code, {
                                        shouldValidate: true,
                                      });
                                      setCountryOpen(false);
                                    }}
                                    className="flex cursor-pointer items-center gap-2 px-3 py-2"
                                  >
                                    <span className="text-base">{countryFlag(country.code)}</span>
                                    <span className="flex-1 truncate text-sm">{country.name}</span>
                                    {selectedCountry === country.code && (
                                      <Check className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                    <span className={labelClass}>{t.stayDatesSection}</span>
                    <span className="text-[10px] text-zinc-400">({t.stayOptional})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormField
                      control={form.control}
                      name="checkInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>{t.guestCheckIn}</FormLabel>
                          <FormControl>
                            <input type="date" className={dateClass} {...field} />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="checkOutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>{t.guestCheckOut}</FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              min={minCheckOutDate(watchedCheckIn)}
                              className={dateClass}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-3.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createGuestMutation.isPending}
                  className="h-10 flex-1 rounded-xl border-zinc-200 bg-white text-sm font-medium"
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  data-testid="button-submit-guest"
                  disabled={createGuestMutation.isPending || wifiNetworksLoading}
                  className="h-10 flex-1 rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                >
                  {createGuestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.generateKeyQrBtn
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ManagerCenterSheet>

      {handoff && (
        <GuestHandoffModal
          open={handoffOpen}
          data={handoff}
          onClose={() => {
            setHandoffOpen(false);
            setHandoff(null);
            onClose();
          }}
          onCreateAnother={handleCreateAnother}
        />
      )}
    </>
  );
}
