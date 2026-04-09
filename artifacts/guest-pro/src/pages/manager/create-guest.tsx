import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateGuest } from "@workspace/api-client-react";
import { isStaffRole } from "@/lib/permissions";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Copy,
  Check,
  ChevronsUpDown,
  Globe,
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

const guestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  countryCode: z.string().min(2, "Country is required"),
});

type GuestForm = z.infer<typeof guestSchema>;

export default function CreateGuest() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createGuestMutation = useCreateGuest();

  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const form = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { firstName: "", lastName: "", roomNumber: "", countryCode: "" },
  });

  const selectedCountry = form.watch("countryCode");

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
          setCreatedKey(res.guestKey);
          queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
          toast.success("Guest created successfully");
        },
        onError: (err) => {
          toast.error(err.data?.error || "Failed to create guest");
        },
      }
    );
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      toast.success("Guest key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  return (
    <div className="min-h-[100dvh] bg-zinc-50/50 pb-20">
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
          <div>
            <h1 className="font-serif text-xl font-medium text-zinc-900">New Guest</h1>
            <p className="text-xs text-zinc-500 font-medium">Issue a new digital key</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {createdKey ? (
          <Card className="border-0 shadow-xl shadow-zinc-200/50 rounded-3xl overflow-hidden bg-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white pointer-events-none" />
            <CardContent className="p-8 md:p-12 relative flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-zinc-900/20">
                <KeyRound className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-medium text-zinc-900 mb-2">
                Guest Key Generated
              </h2>
              <p className="text-zinc-500 mb-8 max-w-sm">
                Share this secure digital key with the guest. They will use it to access
                the app and their room features.
              </p>

              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 w-full max-w-sm mb-8 flex items-center justify-between">
                <span className="font-mono text-2xl tracking-widest font-medium text-zinc-800 select-all">
                  {createdKey}
                </span>
                <Button
                  data-testid="button-copy-key"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm border-zinc-200 hover:bg-zinc-50"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-600" />
                  )}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                  data-testid="button-create-another"
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl border-zinc-200 text-zinc-700 font-medium"
                  onClick={() => {
                    setCreatedKey(null);
                    form.reset();
                  }}
                >
                  Create Another
                </Button>
                <Button
                  data-testid="button-done"
                  className="flex-1 h-12 rounded-2xl font-medium shadow-md shadow-zinc-900/10"
                  onClick={() => setLocation("/manager")}
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                          <FormLabel className="text-zinc-700 font-medium ml-1">
                            First name
                          </FormLabel>
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
                          <FormLabel className="text-zinc-700 font-medium ml-1">
                            Last name
                          </FormLabel>
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
                        <FormLabel className="text-zinc-700 font-medium ml-1">
                          Room number
                        </FormLabel>
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
                        <FormLabel className="text-zinc-700 font-medium ml-1">
                          Guest country
                        </FormLabel>
                        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <button
                                type="button"
                                data-testid="input-country"
                                role="combobox"
                                aria-expanded={countryOpen}
                                className={`w-full h-14 rounded-2xl border text-base px-4 flex items-center gap-3 transition-all bg-zinc-50/50 hover:bg-zinc-100/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 ${
                                  field.value
                                    ? "border-zinc-200 text-zinc-900"
                                    : "border-zinc-200 text-zinc-400"
                                }`}
                              >
                                {field.value ? (
                                  <>
                                    <span className="text-xl leading-none">
                                      {countryFlag(field.value)}
                                    </span>
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
                            className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-xl border-zinc-200"
                            align="start"
                            sideOffset={4}
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search country…"
                                className="h-12 text-base border-0 focus:ring-0"
                              />
                              <CommandList className="max-h-[280px]">
                                <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
                                  No country found.
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
                                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                    >
                                      <span className="text-xl leading-none w-7 shrink-0">
                                        {countryFlag(country.code)}
                                      </span>
                                      <span className="flex-1 text-[15px]">
                                        {country.name}
                                      </span>
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

                  <div className="pt-4 flex justify-end">
                    <Button
                      data-testid="button-submit-guest"
                      type="submit"
                      className="w-full md:w-auto px-8 h-14 rounded-2xl text-base font-medium shadow-lg shadow-zinc-900/10"
                      disabled={createGuestMutation.isPending}
                    >
                      {createGuestMutation.isPending ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : null}
                      Generate Key
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
