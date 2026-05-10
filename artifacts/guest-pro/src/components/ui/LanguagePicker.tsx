/**
 * LanguagePicker
 *
 * Compact globe-icon button that opens a dropdown to switch between
 * English · Türkçe · العربية.
 *
 * Used in Manager · Personnel · Restaurant dashboard headers.
 * Integrates with useStaffLocale (localStorage + custom-event reactive).
 *
 * Also exported as a standalone variant for the guest header (GuestLanguagePicker)
 * which uses the guest i18n path.
 */

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { type StaffLocale } from "@/lib/staff-i18n";

interface LangOption {
  code: StaffLocale;
  label: string;      // native name shown in menu
  short: string;      // 2-char label shown on button when active
  flag: string;       // emoji flag
}

const LANGUAGES: LangOption[] = [
  { code: "tr", label: "Türkçe",   short: "TR", flag: "🇹🇷" },
  { code: "en", label: "English",  short: "EN", flag: "🇬🇧" },
  { code: "ar", label: "العربية",  short: "AR", flag: "🇸🇦" },
];

interface LanguagePickerProps {
  locale: StaffLocale;
  onLocaleChange: (locale: StaffLocale) => void;
  /** Direction of the parent container — used to position the dropdown correctly */
  dir?: "ltr" | "rtl";
}

export function LanguagePicker({ locale, onLocaleChange, dir = "ltr" }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  // Dropdown opens below and aligns to the end (right in LTR, left in RTL)
  const dropdownAlign = dir === "rtl" ? "left-0" : "right-0";

  return (
    <div ref={ref} className="relative" dir="ltr" /* always LTR internally */>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className={`flex items-center gap-1 h-8 px-2 rounded-xl transition-all touch-manipulation
          ${open
            ? "bg-zinc-100 text-zinc-700"
            : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
          }`}
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[11px] font-bold tracking-wide leading-none">{current.short}</span>
      </button>

      {open && (
        <div
          className={`absolute top-10 ${dropdownAlign} z-50 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-900/10 overflow-hidden min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150`}
        >
          <div className="p-1">
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLocaleChange(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all touch-manipulation
                    ${isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className={`text-[13px] font-semibold ${lang.code === "ar" ? "font-arabic" : ""}`}>
                    {lang.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] font-bold text-white/60">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
