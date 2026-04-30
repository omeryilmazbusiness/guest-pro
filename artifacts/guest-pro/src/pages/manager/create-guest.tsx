import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateGuest } from "@workspace/api-client-react";
import { isStaffRole } from "@/lib/permissions";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  ChevronsUpDown,
  Check,
  Globe,
  CalendarDays,
  ScanLine,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useQueryClient } from "@tanstack/react-query";
import { getListGuestsQueryKey } from "@workspace/api-client-react";
import { COUNTRIES, countryFlag } from "@/lib/locale";
import { GuestHandoffModal } from "@/components/GuestHandoffModal";
import type { HandoffData } from "@/components/GuestHandoffModal";
import { todayIso, minCheckOutDate } from "@/lib/stays";

import { useQrScannerGun } from "@/hooks/use-qr-scanner-gun";
import { alpha3ToAlpha2 } from "@/lib/passport/nationality-map";
import type { PassportData } from "@/lib/passport/types";

const guestSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    roomNumber: z.string().min(1, "Room number is required"),
    countryCode: z.string().min(2, "Country is required"),
    checkInDate: z.string().optional(),
    checkOutDate: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.checkInDate && d.checkOutDate) {
        return d.checkOutDate > d.checkInDate;
      }
      return true;
    },
    { message: "Check-out must be after check-in", path: ["checkOutDate"] }
  );

type GuestForm = z.infer<typeof guestSchema>;

export default function CreateGuest() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createGuestMutation = useCreateGuest();

  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [scannerFilled, setScannerFilled] = useState(false);

  const today = todayIso();

  const form = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      roomNumber: "",
      countryCode: "",
      checkInDate: today,
      checkOutDate: "",
    },
  });

  const selectedCountry = form.watch("countryCode");
  const watchedCheckIn = form.watch("checkInDate");

  // ── Scanner gun auto-fill ─────────────────────────────────────────────────
  const handleScan = useCallback(
    (data: PassportData) => {
      const alpha2 = alpha3ToAlpha2(data.nationality);
      form.setValue("firstName", data.firstName, { shouldValidate: true });
      form.setValue("lastName", data.lastName, { shouldValidate: true });
      if (alpha2) form.setValue("countryCode", alpha2, { shouldValidate: true });
      setScannerFilled(true);
      toast.success(`Passport scanned — ${data.firstName} ${data.lastName}`, {
        description: alpha2 ? `Nationality: ${alpha2}` : "Nationality not matched — select manually",
        duration: 4000,
      });
    },
    [form],
  );

  const handleScanError = useCallback((_raw: string) => {
    toast.error("QR code not recognised", { description: "Ensure it is a Guest-Pro passport QR.", duration: 3000 });
  }, []);

  useQrScannerGun({ onScan: handleScan, onError: handleScanError, enabled: isAuthenticated && !modalOpen });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user && !isStaffRole(user.role)) {
      setLocation("/guest");
    }
  }, [isAuthenticated, user, setLocation]);

  const onSubmit = (data: GuestForm) => {
    createGuestMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
          toast.success("Guest created successfully");
          setScannerFilled(false);
          setHandoff({
            firstName: res.guest.firstName,
            lastName: res.guest.lastName,
            roomNumber: res.guest.roomNumber,
            guestKey: res.guestKey,
            qrLoginUrl: res.qrLoginUrl,
            qrTokenExpiresAt: res.qrTokenExpiresAt,
          });
          setModalOpen(true);
        },
        onError: (err) => {
          toast.error(err.data?.error || "Failed to create guest");
        },
      }
    );
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setLocation("/manager");
  };

  const handleCreateAnother = () => {
    setModalOpen(false);
    setHandoff(null);
    form.reset({ firstName: "", lastName: "", roomNumber: "", countryCode: "", checkInDate: today, checkOutDate: "" });
  };

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  return (
    <div className="min-h-dvh bg-zinc-50/50 pb-20">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
          <Button
            data-testid="button-back"
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/manager")}
            className="w-10 h-10 rounded-xl hover:bg-zinc-100 -ml-2 text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-medium text-zinc-900">New Guest</h1>
            <p className="text-xs text-zinc-500 font-medium">Issue a new digital key</p>
          </div>
          {/* Scanner ready indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
            <ScanLine className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Scanner ready</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {scannerFilled && (
          <div className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-green-50 border border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">Passport data filled from QR scan — verify and complete remaining fields.</p>
          </div>
        )}

        <Card className="border-0 shadow-lg shadow-zinc-200/30 rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Name row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 font-medium ml-1">First name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-first-name"
                            placeholder="Jane"
                            className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 transition-all text-base px-4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 font-medium ml-1">Last name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-last-name"
                            placeholder="Doe"
                            className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 transition-all text-base px-4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Room number */}
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-700 font-medium ml-1">Room number</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-room-number"
                          placeholder="e.g. 402"
                          className="h-14 rounded-2xl bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 transition-all text-base px-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country selector */}
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-700 font-medium ml-1">Guest country</FormLabel>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              data-testid="input-country"
                              role="combobox"
                              aria-expanded={countryOpen}
                              className={`w-full h-14 rounded-2xl border text-base px-4 flex items-center gap-3 transition-all bg-zinc-50/50 hover:bg-zinc-100/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 ${
                                field.value ? "border-zinc-200 text-zinc-900" : "border-zinc-200 text-zinc-400"
                              }`}
                            >
                              {field.value ? (
                                <>
                                  <span className="text-xl leading-none">{countryFlag(field.value)}</span>
                                  <span className="flex-1 text-left font-medium">
                                    {COUNTRIES.find((c) => c.code === field.value)?.name ?? field.value}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-4 h-4 text-zinc-400" />
                                  <span className="flex-1 text-left">Select country…</span>
                                </>
                              )}
                              <ChevronsUpDown className="w-4 h-4 text-zinc-400 shrink-0" />
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-(--radix-popover-trigger-width) p-0 rounded-2xl shadow-xl border-zinc-200"
                          align="start"
                          sideOffset={4}
                        >
                          <Command>
                            <CommandInput
                              placeholder="Search country…"
                              className="h-12 text-base border-0 focus:ring-0"
                            />
                            <CommandList className="max-h-70">
                              <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
                                No country found.
                              </CommandEmpty>
                              <CommandGroup>
                                {COUNTRIES.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={country.name}
                                    onSelect={() => {
                                      form.setValue("countryCode", country.code, { shouldValidate: true });
                                      setCountryOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                  >
                                    <span className="text-xl leading-none w-7 shrink-0">{countryFlag(country.code)}</span>
                                    <span className="flex-1 text-[15px]">{country.name}</span>
                                    {selectedCountry === country.code && (
                                      <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                      {field.value && (
                        <p className="text-xs text-zinc-400 ml-1 mt-1">
                          Guest UI will be shown in the language of this country.
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Stay dates */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700">Stay dates</span>
                    <span className="text-xs text-zinc-400">(optional)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="checkInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-700 font-medium ml-1">Check-in</FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              className="w-full h-14 rounded-2xl bg-zinc-50/50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none text-base px-4 text-zinc-900 cursor-pointer"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="checkOutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-700 font-medium ml-1">Check-out</FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              min={minCheckOutDate(watchedCheckIn)}
                              className="w-full h-14 rounded-2xl bg-zinc-50/50 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-none text-base px-4 text-zinc-900 cursor-pointer"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    data-testid="button-submit-guest"
                    type="submit"
                    className="w-full md:w-auto px-8 h-14 rounded-2xl text-base font-medium shadow-lg shadow-zinc-900/10"
                    disabled={createGuestMutation.isPending}
                  >
                    {createGuestMutation.isPending ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : null}
                    Generate Key & QR
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      {handoff && (
        <GuestHandoffModal
          open={modalOpen}
          onClose={handleModalClose}
          onCreateAnother={handleCreateAnother}
          data={handoff}
        />
      )}
    </div>
  );
}
