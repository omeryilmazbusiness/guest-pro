import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { GuestProLogo } from "@/components/GuestProLogo";
import { MarketingLanguageSwitcher } from "@/components/marketing/MarketingLanguageSwitcher";
import { RequestDemoDialog } from "@/components/marketing/RequestDemoDialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { ROUTES } from "@/lib/app-routes";
import { MARKETING_NAV } from "@/lib/marketing/content";
import { HEAVY_EASE } from "@/lib/marketing/motion";
import { cn } from "@/lib/utils";

interface MarketingHeaderProps {
  onNavigate: (href: string) => void;
}

export function MarketingHeader({ onNavigate }: MarketingHeaderProps) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { t, dir } = useMarketingLocale();

  const handleNav = (href: string) => {
    setMenuOpen(false);
    onNavigate(href);
  };

  return (
    <motion.header
      className="marketing-header sticky top-0 z-50 border-b border-white/[0.06] bg-black/50 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4 md:px-10"
      initial={reduceMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: HEAVY_EASE }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <a
          href="#hero"
          className="marketing-touch-target flex min-w-0 items-center gap-2 sm:gap-3"
          onClick={(e) => {
            e.preventDefault();
            handleNav("#hero");
          }}
        >
          <GuestProLogo variant="header" className="h-8 w-auto shrink-0 invert brightness-110 sm:h-9" />
          <span className="marketing-landing__brand hidden truncate text-sm font-medium tracking-[0.2em] uppercase sm:inline">
            {t.header.brand}
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {MARKETING_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.href)}
              className="marketing-touch-target rounded-full px-4 py-2 text-sm text-white/65 transition-colors hover:bg-white/8 hover:text-white"
            >
              {t.nav[item.labelKey]}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <MarketingLanguageSwitcher className="hidden md:inline-flex" />

          <RequestDemoDialog
            trigger={
              <Button
                size="sm"
                className="hidden min-h-9 gap-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/15 md:inline-flex"
              >
                {t.header.requestDemo}
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            className="hidden min-h-9 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 md:inline-flex"
            onClick={() => setLocation(ROUTES.login)}
          >
            {t.header.signIn}
          </Button>

          <MarketingLanguageSwitcher compact className="md:hidden" />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-10 shrink-0 rounded-full border-white/20 bg-white/5 text-white md:hidden"
                aria-label={menuOpen ? t.header.closeMenu : t.header.openMenu}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent
              side={dir === "rtl" ? "left" : "right"}
              className="marketing-nav-sheet flex w-full flex-col border-white/10 bg-neutral-950 text-white sm:max-w-sm"
            >
              <SheetHeader className="text-start">
                <SheetTitle className="text-white">{t.header.menu}</SheetTitle>
              </SheetHeader>

              <div className="marketing-nav-sheet__lang mt-6 flex flex-col gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  {t.lang.menuLabel}
                </p>
                <MarketingLanguageSwitcher block />
              </div>

              <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Mobile">
                {MARKETING_NAV.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.href)}
                    className="marketing-nav-sheet__link marketing-touch-target rounded-xl px-4 text-start font-medium text-white/85 transition-colors active:bg-white/10"
                  >
                    {t.nav[item.labelKey]}
                  </button>
                ))}
              </nav>

              <div className="mt-6 flex flex-col gap-2.5 border-t border-white/10 pt-6">
                <RequestDemoDialog
                  trigger={
                    <Button className="marketing-landing__btn-primary marketing-btn-mobile min-h-12 rounded-full">
                      {t.header.requestDemo}
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  className={cn(
                    "marketing-btn-mobile min-h-12 rounded-full border-white/20 text-white",
                    "hover:bg-white/10 active:bg-white/10",
                  )}
                  onClick={() => {
                    setMenuOpen(false);
                    setLocation(ROUTES.login);
                  }}
                >
                  {t.header.signIn}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
