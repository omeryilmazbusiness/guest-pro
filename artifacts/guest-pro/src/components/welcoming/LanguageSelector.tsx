/**
 * LanguageSelector — premium language picker for the welcoming screen.
 *
 * Renders as a styled trigger button that opens a Popover with 6 option rows.
 * Each row shows the native language name and its greeting word.
 * The selected option gets a subtle inset ring and check indicator.
 */

import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WELCOMING_LANGUAGES, getWelcomingLanguage } from "@/lib/welcoming/languages";
import type { WelcomingLocale } from "@/lib/welcoming/types";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  selected: WelcomingLocale;
  onSelect: (locale: WelcomingLocale) => void;
  /** Label above the button, e.g. "Select your language" */
  label: string;
}

export function LanguageSelector({ selected, onSelect, label }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = getWelcomingLanguage(selected);

  function handleSelect(locale: WelcomingLocale) {
    onSelect(locale);
    setOpen(false);
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Floating label */}
      <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
        {label}
      </p>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl",
              "bg-zinc-800/60 border border-zinc-700/50 backdrop-blur-sm",
              "text-left transition-all duration-150",
              "hover:bg-zinc-800 hover:border-zinc-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
              open && "bg-zinc-800 border-zinc-600",
            )}
            aria-expanded={open}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="flex flex-col min-w-0" dir={current.dir}>
                <span className="text-sm font-medium text-white leading-tight truncate">
                  {current.label}
                </span>
                <span className="text-[11px] text-zinc-400 leading-tight truncate">
                  {current.greeting}
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            "w-72 p-1.5 rounded-2xl shadow-2xl shadow-black/40",
            "bg-zinc-900 border border-zinc-700/60",
          )}
          sideOffset={8}
          align="center"
        >
          <div className="flex flex-col gap-0.5" role="listbox" aria-label="language options">
            {WELCOMING_LANGUAGES.map((lang) => {
              const isSelected = lang.uiLocale === selected;
              return (
                <button
                  key={lang.uiLocale}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.uiLocale)}
                  dir={lang.dir}
                  className={cn(
                    "group flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl",
                    "text-left transition-all duration-100",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-zinc-300 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium leading-tight">{lang.label}</span>
                    <span className="text-[11px] text-zinc-500 leading-tight group-hover:text-zinc-400 transition-colors">
                      {lang.greeting}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-white/70 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
