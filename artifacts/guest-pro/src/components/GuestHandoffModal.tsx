/**
 * GuestHandoffModal
 *
 * Displayed immediately after a new guest is created. Shows the staff:
 *   - QR code encoding the secure auto-login URL (single-use, 24h token)
 *   - Guest full name and room number
 *   - Copyable guest key (operational fallback if QR is lost)
 *   - Expiry info so staff know how long the QR is valid
 *
 * The QR code auto-login URL contains a 32-byte random token whose SHA-256
 * hash is stored server-side. The raw token is never stored on disk.
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, X, QrCode, KeyRound, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface HandoffData {
  firstName: string;
  lastName: string;
  roomNumber: string;
  guestKey: string;
  qrLoginUrl: string;
  qrTokenExpiresAt: string; // ISO string
}

interface GuestHandoffModalProps {
  open: boolean;
  onClose: () => void;
  onCreateAnother: () => void;
  data: HandoffData;
}

export function GuestHandoffModal({
  open,
  onClose,
  onCreateAnother,
  data,
}: GuestHandoffModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Render QR code to canvas whenever the URL changes
  useEffect(() => {
    if (!open || !canvasRef.current || !data.qrLoginUrl) return;
    QRCode.toCanvas(canvasRef.current, data.qrLoginUrl, {
      width: 220,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
    });
  }, [open, data.qrLoginUrl]);

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(data.guestKey);
      setKeyCopied(true);
      toast.success("Guest key copied");
      setTimeout(() => setKeyCopied(false), 2500);
    } catch {
      toast.error("Copy failed — please select and copy manually");
    }
  };

  const expiresAt = new Date(data.qrTokenExpiresAt);
  const expiresLabel = expiresAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md rounded-3xl border-0 shadow-2xl shadow-zinc-900/20 bg-white p-0 overflow-hidden"
        aria-describedby="handoff-desc"
      >
        {/* Top strip — room + name badge */}
        <div className="bg-zinc-900 px-8 pt-8 pb-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-zinc-400">
              Guest Ready
            </span>
          </div>
          <DialogTitle className="text-2xl font-serif font-medium text-white leading-tight">
            {data.firstName} {data.lastName}
          </DialogTitle>
          <p className="text-zinc-400 text-sm mt-1 font-medium">Room {data.roomNumber}</p>
        </div>

        <div className="px-8 py-6 flex flex-col items-center gap-6">
          <p id="handoff-desc" className="sr-only">
            Guest handoff card for {data.firstName} {data.lastName} in room {data.roomNumber}.
          </p>

          {/* QR code */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white rounded-2xl shadow-lg shadow-zinc-200/60 border border-zinc-100">
              <canvas ref={canvasRef} className="block rounded-xl" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan to log in instantly</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires {expiresLabel} · single-use</span>
            </div>
          </div>

          {/* Divider with label */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400 font-medium">or use the key</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* Guest key */}
          <div className="w-full">
            <div className="flex items-center gap-2 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Guest Key
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4">
              <span className="font-mono text-xl tracking-widest font-semibold text-zinc-800 select-all">
                {data.guestKey}
              </span>
              <Button
                data-testid="button-copy-guest-key"
                variant="outline"
                size="icon"
                onClick={handleCopyKey}
                className="w-10 h-10 shrink-0 rounded-xl bg-white shadow-sm border-zinc-200 hover:bg-zinc-50 transition-colors"
                aria-label="Copy guest key"
              >
                {keyCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-500" />
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 ml-1">
              Share this key if the guest cannot scan the QR.
            </p>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              data-testid="button-create-another"
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-zinc-200 text-zinc-700 font-medium"
              onClick={onCreateAnother}
            >
              Create Another
            </Button>
            <Button
              data-testid="button-done"
              className="flex-1 h-12 rounded-2xl font-medium shadow-md shadow-zinc-900/10"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
