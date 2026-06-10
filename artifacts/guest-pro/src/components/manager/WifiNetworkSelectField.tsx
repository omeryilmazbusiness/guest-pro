import { useState } from "react";
import { Check, ChevronsUpDown, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotelWifiNetwork } from "@/lib/hotel-wifi";
import {
  FormControl,
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

interface WifiNetworkSelectFieldProps {
  label: string;
  placeholder: string;
  emptyLabel: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  networks: HotelWifiNetwork[];
  loading?: boolean;
  labelClassName?: string;
  triggerClassName?: string;
}

export function WifiNetworkSelectField({
  label,
  placeholder,
  emptyLabel,
  value,
  onChange,
  networks,
  loading = false,
  labelClassName,
  triggerClassName,
}: WifiNetworkSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = networks.find((n) => n.id === value);

  return (
    <FormItem>
      <FormLabel className={labelClassName}>{label}</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              disabled={loading || networks.length === 0}
              className={cn(
                "flex h-9 w-full items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 text-sm transition-colors",
                selected ? "text-zinc-900" : "text-zinc-400",
                triggerClassName,
              )}
            >
              <Wifi className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="min-w-0 flex-1 truncate text-left font-medium">
                {loading
                  ? "…"
                  : networks.length === 0
                    ? emptyLabel
                    : selected?.name ?? placeholder}
              </span>
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
            <CommandInput placeholder={placeholder} className="h-9 border-0 text-sm" />
            <CommandList className="max-h-48">
              <CommandEmpty className="py-4 text-center text-xs text-zinc-400">
                {emptyLabel}
              </CommandEmpty>
              <CommandGroup>
                {networks.map((network) => (
                  <CommandItem
                    key={network.id}
                    value={network.name}
                    onSelect={() => {
                      onChange(network.id);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2"
                  >
                    <Wifi className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="flex-1 truncate text-sm font-mono">{network.name}</span>
                    {value === network.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage className="text-[11px]" />
    </FormItem>
  );
}
