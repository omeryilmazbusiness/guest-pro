import { Languages } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { MARKETING_LOCALES } from "@/lib/marketing/i18n";
import { cn } from "@/lib/utils";

interface MarketingLanguageSwitcherProps {
  className?: string;
  /** Compact icon-only on very small screens */
  compact?: boolean;
  /** Full-width row (mobile drawer) */
  block?: boolean;
}

export function MarketingLanguageSwitcher({
  className,
  compact = false,
  block = false,
}: MarketingLanguageSwitcherProps) {
  const { locale, t, setLocale } = useMarketingLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={cn(
            "border-white/20 bg-white/5 text-white hover:bg-white/10",
            block
              ? "marketing-touch-target h-12 w-full justify-between rounded-xl px-4"
              : "rounded-full",
            !compact && !block && "gap-2 px-3",
            compact && !block && "size-10",
            className,
          )}
          aria-label={t.lang.menuLabel}
        >
          <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
          {(!compact || block) && (
            <span
              className={cn(
                "truncate text-xs sm:text-sm",
                block ? "flex-1 text-start" : "max-w-[5.5rem] sm:max-w-none",
              )}
            >
              {t.lang[MARKETING_LOCALES.find((l) => l.code === locale)!.labelKey]}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[11rem] border-white/10 bg-neutral-950 text-white"
      >
        {MARKETING_LOCALES.map(({ code, flagCode, labelKey }) => (
          <DropdownMenuItem
            key={code}
            className={cn(
              "gap-2.5 focus:bg-white/10 focus:text-white",
              locale === code && "bg-white/8",
            )}
            onClick={() => setLocale(code)}
          >
            <CountryFlag code={flagCode} size="sm" />
            <span>{t.lang[labelKey]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
