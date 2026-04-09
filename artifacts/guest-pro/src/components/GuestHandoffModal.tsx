/**
 * GuestHandoffModal
 *
 * Shown immediately after a new guest is created. Presents the handoff
 * card to staff so they can pass credentials to the guest physically.
 *
 * Architecture:
 *   - useQrDataUrl hook handles all QR generation (SVG data URL, async, no DOM ref)
 *   - GuestQrCard renders the QR display (pure presentational)
 *   - GuestKeyRow renders the copyable key (pure presentational)
 *   - This modal owns layout, actions, and open/close lifecycle only
 *
 * QR Security:
 *   The QR encodes a secure single-use 24-hour auto-login URL issued
 *   server-side. The raw token is never stored in the DB — only SHA-256(token).
 */

import { useState } from "react";
import { Copy, Check, QrCode, KeyRound, Clock, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQrDataUrl } from "@/hooks/use-qr-data-url";

// ─── Domain types ────────────────────────────────────────────────────────────

export interface HandoffData {
  firstName: string;
  lastName: string;
  roomNumber: string;
  guestKey: string;
  qrLoginUrl: string;
  qrTokenExpiresAt: string; // ISO 8601
}

// ─── Sub-components (presentational) ─────────────────────────────────────────

interface GuestQrCardProps {
  dataUrl: string | null;
  generating: boolean;
  error: string | null;
  expiresLabel: string;
}

function GuestQrCard({ dataUrl, generating, error, expiresLabel }: GuestQrCardProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR frame */}
      <div className="p-4 bg-white rounded-2xl shadow-lg shadow-zinc-200/60 border border-zinc-100 flex items-center justify-center"
        style={{ width: 220, height: 220 }}>
        {generating && (
          <Loader2 className="w-8 h-8 text-zinc-300 animate-spin" />
        )}
        {!generating && error && (
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-xs text-zinc-400 max-w-[140px] leading-relaxed">{error}</span>
          </div>
        )}
        {!generating && !error && dataUrl && (
          <img
            src={dataUrl}
            alt="Guest QR code for auto-login"
            width={188}
            height={188}
            className="block rounded-xl"
            draggable={false}
          />
        )}
      </div>

      {/* Caption row */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <QrCode className="w-3.5 h-3.5 shrink-0" />
        <span>Scan to log in instantly</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Expires {expiresLabel} · single-use</span>
      </div>
    </div>
  );
}

interface GuestKeyRowProps {
  guestKey: string;
}

function GuestKeyRow({ guestKey }: GuestKeyRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guestKey);
      setCopied(true);
      toast.success("Guest key copied");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Copy failed — please select and copy manually");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1.5">
        <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
          Guest Key
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4">
        <span className="font-mono text-xl tracking-widest font-semibold text-zinc-800 select-all">
          {guestKey}
        </span>
        <Button
          data-testid="button-copy-guest-key"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="w-10 h-10 shrink-0 rounded-xl bg-white shadow-sm border-zinc-200 hover:bg-zinc-50 transition-colors"
          aria-label="Copy guest key"
        >
          {copied ? (
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
  );
}

// ─── Modal (presentation + lifecycle only) ────────────────────────────────────

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
  // QR generation is entirely state-driven — no canvas ref, no DOM timing issue.
  // useQrDataUrl generates an SVG data URL whenever qrLoginUrl changes.
  // Works correctly inside Radix UI portals and animated dialogs.
  const { dataUrl, generating, error } = useQrDataUrl(
    open ? data.qrLoginUrl : null
  );

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
        {/* ── Top strip — identity badge ── */}
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
          <p className="text-zinc-400 text-sm mt-1 font-medium">
            Room {data.roomNumber}
          </p>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 flex flex-col items-center gap-6">
          <p id="handoff-desc" className="sr-only">
            Guest handoff card for {data.firstName} {data.lastName} in room{" "}
            {data.roomNumber}.
          </p>

          {/* QR section */}
          <GuestQrCard
            dataUrl={dataUrl}
            generating={generating}
            error={error}
            expiresLabel={expiresLabel}
          />

          {/* Divider */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400 font-medium">or use the key</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* Key section */}
          <GuestKeyRow guestKey={data.guestKey} />

          {/* Actions */}
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
