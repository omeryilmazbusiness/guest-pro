import { Home, Loader2 } from "lucide-react";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { ROUTES } from "@/lib/app-routes";
import { Button } from "@/components/ui/button";

export function SectionSaveBar({
  label,
  homeLabel,
  saving,
  onSave,
  onHome,
  showHome = true,
}: {
  label: string;
  homeLabel: string;
  saving: boolean;
  onSave: () => void | Promise<void>;
  /** When set, Home saves first; return false to stay on the page. */
  onHome?: () => void | Promise<boolean | void>;
  showHome?: boolean;
}) {
  const navigate = useTenantNav();

  const handleHome = async () => {
    if (onHome) {
      const ok = await onHome();
      if (ok === false) return;
    }
    navigate(ROUTES.manager);
  };

  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-3">
      {showHome && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          className="h-8 rounded-lg border-zinc-200 px-3 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50"
          onClick={() => void handleHome()}
        >
          <Home className="mr-1.5 h-3.5 w-3.5" />
          {homeLabel}
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={saving}
        onClick={onSave}
        className="h-8 rounded-lg border-zinc-200 px-3 text-[12px] font-medium text-zinc-800 hover:bg-zinc-50"
      >
        {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
        {label}
      </Button>
    </div>
  );
}
