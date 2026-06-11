import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { LogOut } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface GuestLogoutConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function GuestLogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: GuestLogoutConfirmDialogProps) {
  const { t } = useLocale();

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed z-[201] grid w-full gap-0 border border-zinc-100 bg-white p-0 shadow-2xl duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-w-none",
            "max-sm:rounded-b-none max-sm:rounded-t-[28px]",
            "max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]",
            "max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom",
            "sm:left-1/2 sm:top-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          )}
        >
          <div className="max-sm:mx-auto max-sm:mb-1 max-sm:mt-2 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />

          <div className="px-6 pb-2 pt-5 text-center sm:pt-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50">
              <LogOut className="h-5 w-5 text-zinc-400" strokeWidth={1.75} />
            </div>
            <AlertDialogPrimitive.Title className="font-serif text-[17px] font-medium text-zinc-900">
              {t.logoutConfirmTitle}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="mt-2 text-[14px] leading-relaxed text-zinc-500">
              {t.logoutConfirmMessage}
            </AlertDialogPrimitive.Description>
          </div>

          <div className="space-y-2 px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.99]"
            >
              {t.logout}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-2xl py-3 text-[15px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
            >
              {t.cancel}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
