/**
 * GuestDeleteDialog
 *
 * A safe confirmation dialog before permanently removing a guest.
 * Uses AlertDialog for accessible keyboard/escape behavior.
 * Only rendered for users with DELETE_GUEST permission (manager only).
 */

import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { Guest } from "@workspace/api-client-react";

interface GuestDeleteDialogProps {
  open: boolean;
  guest: Guest | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export function GuestDeleteDialog({
  open,
  guest,
  onClose,
  onConfirm,
  isDeleting,
}: GuestDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="rounded-3xl border-0 shadow-2xl shadow-zinc-900/10 bg-white max-w-sm">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <AlertDialogTitle className="text-center text-xl font-serif font-medium text-zinc-900">
            Remove Guest?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-zinc-500 text-sm leading-relaxed">
            {guest ? (
              <>
                This will permanently remove{" "}
                <span className="font-semibold text-zinc-800">
                  {guest.firstName} {guest.lastName}
                </span>{" "}
                from Room {guest.roomNumber}. Their key and QR access will be
                immediately revoked.
              </>
            ) : (
              "This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row mt-2">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-2xl border-zinc-200 text-zinc-700 font-medium"
          >
            Keep Guest
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => guest && onConfirm(guest.id)}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Remove Guest
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
