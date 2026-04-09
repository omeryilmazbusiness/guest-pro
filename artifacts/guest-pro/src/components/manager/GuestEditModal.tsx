/**
 * GuestEditModal
 *
 * A polished dialog for editing a guest's details (name, room, country).
 * Uses the PATCH /guests/:id endpoint via useUpdateGuest.
 * Validates with Zod — same validation pattern as the create-guest form.
 */

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ChevronsUpDown, Check, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COUNTRIES, countryFlag } from "@/lib/locale";
import type { Guest } from "@workspace/api-client-react";
import { useState } from "react";

const editSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  countryCode: z.string().min(2, "Country is required"),
});

type EditForm = z.infer<typeof editSchema>;

interface GuestEditModalProps {
  open: boolean;
  guest: Guest | null;
  onClose: () => void;
  onSave: (id: number, data: EditForm) => Promise<void>;
  isSaving: boolean;
}

export function GuestEditModal({
  open,
  guest,
  onClose,
  onSave,
  isSaving,
}: GuestEditModalProps) {
  const [countryOpen, setCountryOpen] = useState(false);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      roomNumber: "",
      countryCode: "",
    },
  });

  // Reset form whenever the guest changes
  useEffect(() => {
    if (guest) {
      form.reset({
        firstName: guest.firstName,
        lastName: guest.lastName,
        roomNumber: guest.roomNumber,
        countryCode: guest.countryCode,
      });
    }
  }, [guest, form]);

  const selectedCountry = form.watch("countryCode");

  const handleSubmit = async (data: EditForm) => {
    if (!guest) return;
    await onSave(guest.id, data);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl shadow-zinc-900/10 bg-white p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-xl font-serif font-medium text-zinc-900">
            Edit Guest
          </DialogTitle>
          {guest && (
            <p className="text-sm text-zinc-500">
              {guest.firstName} {guest.lastName} · Room {guest.roomNumber}
            </p>
          )}
        </DialogHeader>

        <div className="px-8 pb-2">
          <Form {...form}>
            <form
              id="edit-guest-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
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
                          className="h-12 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
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
                          className="h-12 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        className="h-12 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            className={`w-full h-12 rounded-2xl border text-sm px-4 flex items-center gap-3 bg-zinc-50 hover:bg-zinc-100/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                              field.value ? "border-zinc-200 text-zinc-900" : "border-zinc-200 text-zinc-400"
                            }`}
                          >
                            {field.value ? (
                              <>
                                <span className="text-lg leading-none">{countryFlag(field.value)}</span>
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
                          <CommandInput placeholder="Search country…" className="h-11 text-sm" />
                          <CommandList className="max-h-[220px]">
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
                                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                                >
                                  <span className="text-lg leading-none w-6 shrink-0">{countryFlag(country.code)}</span>
                                  <span className="flex-1 text-sm">{country.name}</span>
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
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="px-8 py-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-12 rounded-2xl border-zinc-200 text-zinc-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-guest-form"
            disabled={isSaving}
            className="flex-1 h-12 rounded-2xl shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
