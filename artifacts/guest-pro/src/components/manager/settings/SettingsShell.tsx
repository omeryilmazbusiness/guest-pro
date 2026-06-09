import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { HotelBrandMark } from "@/components/HotelBrandMark";
import { useTenantNav } from "@/hooks/use-tenant-nav";

interface SettingsShellProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
  wide?: boolean;
}

export function SettingsShell({
  title,
  backTo = "/manager/settings",
  backLabel = "Back",
  children,
  wide = false,
}: SettingsShellProps) {
  const navigate = useTenantNav();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-zinc-50 to-white">
      <header className="sticky top-0 z-20 border-b border-zinc-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <HotelBrandMark variant="compact" framed />
          <span className="flex-1 truncate text-sm font-semibold text-zinc-900">{title}</span>
        </div>
      </header>

      <main
        className={`mx-auto px-4 py-5 pb-20 ${wide ? "max-w-3xl" : "max-w-lg"} md:py-8`}
      >
        {children}
      </main>
    </div>
  );
}
