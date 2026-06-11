import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { countryFlag } from "@/lib/locale";
import { citiesForCountry, PICKER_COUNTRIES } from "@/lib/hotel-cities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CityCountryPickerProps {
  countryCode: string;
  cityName: string;
  onCountryChange: (code: string) => void;
  onCityChange: (city: string) => void;
  labels: {
    country: string;
    city: string;
    countrySearch: string;
    citySearch: string;
    empty: string;
    useCustomCity: string;
  };
}

function SearchSelect({
  value,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  options,
  onSelect,
  icon,
  allowCustom,
  customLabel,
}: {
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  options: { id: string; label: string; prefix?: React.ReactNode }[];
  onSelect: (id: string) => void;
  icon: React.ReactNode;
  allowCustom?: boolean;
  customLabel?: (query: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.id === value);
  const trimmed = query.trim();
  const showCustom =
    allowCustom &&
    trimmed.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm transition-colors",
            value ? "text-zinc-900" : "text-zinc-400",
          )}
        >
          {selected?.prefix ?? icon}
          <span className="min-w-0 flex-1 truncate text-left">
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[120] w-[var(--radix-popover-trigger-width)] rounded-xl border-zinc-100 p-0 shadow-lg" align="start">
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9 border-0 text-sm"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-44">
            <CommandEmpty className="py-3 text-center text-xs text-zinc-400">{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {showCustom && (
                <CommandItem
                  value={trimmed}
                  onSelect={() => {
                    onSelect(trimmed);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-zinc-700"
                >
                  <span className="text-sm">{customLabel?.(trimmed) ?? trimmed}</span>
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => {
                    onSelect(opt.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2"
                >
                  {opt.prefix}
                  <span className="flex-1 truncate text-sm">{opt.label}</span>
                  {value === opt.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CityCountryPicker({
  countryCode,
  cityName,
  onCountryChange,
  onCityChange,
  labels,
}: CityCountryPickerProps) {
  const countryOptions = useMemo(
    () =>
      PICKER_COUNTRIES.map((c) => ({
        id: c.code,
        label: c.name,
        prefix: <span className="text-base leading-none">{countryFlag(c.code)}</span>,
      })),
    [],
  );

  const cityOptions = useMemo(() => {
    const listed = citiesForCountry(countryCode).map((c) => ({ id: c, label: c }));
    if (cityName && !listed.some((c) => c.id.toLowerCase() === cityName.toLowerCase())) {
      return [{ id: cityName, label: cityName }, ...listed];
    }
    return listed;
  }, [countryCode, cityName]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-600">{labels.country}</label>
        <SearchSelect
          value={countryCode}
          placeholder={labels.country}
          searchPlaceholder={labels.countrySearch}
          emptyLabel={labels.empty}
          options={countryOptions}
          onSelect={(code) => {
            onCountryChange(code);
            const cities = citiesForCountry(code);
            if (cityName && !cities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
              onCityChange("");
            }
          }}
          icon={<Globe className="h-3.5 w-3.5 shrink-0" />}
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-600">{labels.city}</label>
        <SearchSelect
          value={cityName}
          placeholder={labels.city}
          searchPlaceholder={labels.citySearch}
          emptyLabel={labels.empty}
          options={cityOptions.map((c) => ({ id: c.id, label: c.label }))}
          onSelect={onCityChange}
          icon={<MapPin className="h-3.5 w-3.5 shrink-0" />}
          allowCustom
          customLabel={(q) => labels.useCustomCity.replace("{city}", q)}
        />
      </div>
    </div>
  );
}
