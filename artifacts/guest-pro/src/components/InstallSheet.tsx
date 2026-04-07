import { Download, X } from "lucide-react";
import type { UseInstallPromptReturn } from "@/hooks/use-install-prompt";

interface Props {
  install: UseInstallPromptReturn;
}

export function InstallSheet({ install }: Props) {
  const {
    showSheet,
    canNativeInstall,
    isIOS,
    isIPad,
    triggerInstall,
    dismiss,
    dismissPermanent,
  } = install;

  if (!showSheet) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={dismiss}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ana ekrana ekle"
        className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300"
      >
        <div className="bg-white rounded-t-[28px] shadow-2xl">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-200" />
          </div>

          <div className="px-6 pt-4 pb-10">
            {/* App identity row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-md shadow-zinc-900/20 shrink-0">
                  <AppIcon />
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-zinc-900 leading-tight">
                    Ana Ekrana Ekle
                  </p>
                  <p className="text-[13px] text-zinc-400 mt-0.5">
                    Guest Pro · AI Concierge
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-1.5 text-zinc-300 hover:text-zinc-500 transition-colors -mr-1"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Guest Pro'yu ana ekranınıza ekleyin — uygulama gibi açılır, tam
              ekran çalışır ve her zaman bir dokunuşla hazır olur.
            </p>

            {canNativeInstall ? (
              <NativeInstallCTA
                onInstall={triggerInstall}
                onDismiss={dismiss}
              />
            ) : isIOS ? (
              <IOSInstructions isIPad={isIPad} onDismiss={dismiss} />
            ) : (
              <FallbackInstructions onDismiss={dismiss} />
            )}

            <button
              onClick={dismissPermanent}
              className="w-full text-center text-[12px] text-zinc-300 hover:text-zinc-400 transition-colors mt-5 py-1"
            >
              Bir daha gösterme
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AppIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 192 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="24" y="24" width="144" height="144" rx="30" fill="#1A1A1A" />
      <path
        d="M96 58C96 58 72 72 72 92C72 106 82 116 96 116C110 116 120 106 120 92C120 72 96 58 96 58Z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="96" cy="130" r="6" fill="white" opacity="0.4" />
      <circle cx="96" cy="130" r="3" fill="white" opacity="0.9" />
    </svg>
  );
}

function NativeInstallCTA({
  onInstall,
  onDismiss,
}: {
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        onClick={onInstall}
        className="w-full bg-zinc-900 text-white rounded-2xl py-4 text-[16px] font-medium flex items-center justify-center gap-2.5 shadow-lg shadow-zinc-900/15 active:scale-[0.98] hover:bg-zinc-800 transition-all duration-150"
      >
        <Download className="w-5 h-5 opacity-70" />
        Ana Ekrana Ekle
      </button>
      <button
        onClick={onDismiss}
        className="w-full bg-zinc-50 text-zinc-500 rounded-2xl py-4 text-[16px] font-medium active:scale-[0.98] hover:bg-zinc-100 transition-all duration-150"
      >
        Daha sonra
      </button>
    </div>
  );
}

function IOSInstructions({
  isIPad,
  onDismiss,
}: {
  isIPad: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {/* Step 1 */}
        <StepCard
          number={1}
          icon={<ShareIcon />}
          title={
            isIPad
              ? "Sağ üstteki Share ikonuna dokunun"
              : "Alt bardaki Share ikonuna dokunun"
          }
          hint={
            isIPad
              ? "Safari'nin sağ üst köşesindeki kutu-ok simgesi"
              : "Safari'nin alt çubuğundaki kutu-ok simgesi"
          }
        />

        {/* Step 2 — iPad needs "View More" step */}
        {isIPad && (
          <StepCard
            number={2}
            icon={<MoreIcon />}
            title="View More / More seçeneğine dokunun"
            hint="Paylaşım menüsünde aşağı kaydırın veya More'a dokunun"
          />
        )}

        {/* Step 3 */}
        <StepCard
          number={isIPad ? 3 : 2}
          icon={<AddHomeIcon />}
          title="Add to Home Screen'e dokunun"
          hint="Listeyi aşağı kaydırarak bulabilirsiniz"
        />

        {/* Step 4 */}
        <StepCard
          number={isIPad ? 4 : 3}
          icon={<AddButtonIcon />}
          title="Add diyerek onaylayın"
          hint="Guest Pro ana ekranınızda görünecek"
        />
      </div>

      <button
        onClick={onDismiss}
        className="w-full bg-zinc-50 text-zinc-500 rounded-2xl py-4 text-[16px] font-medium active:scale-[0.98] hover:bg-zinc-100 transition-all duration-150 mt-1"
      >
        Daha sonra
      </button>
    </div>
  );
}

function FallbackInstructions({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <StepCard
          number={1}
          icon={<MoreIcon />}
          title="Tarayıcı menüsünü açın"
          hint="Üç nokta menüsü veya paylaşım simgesi"
        />
        <StepCard
          number={2}
          icon={<AddHomeIcon />}
          title="Ana Ekrana Ekle'yi seçin"
          hint="Veya 'Uygulamayı Yükle' seçeneği"
        />
        <StepCard
          number={3}
          icon={<AddButtonIcon />}
          title="Onaylayın"
          hint="Guest Pro ana ekranınızda görünecek"
        />
      </div>
      <button
        onClick={onDismiss}
        className="w-full bg-zinc-50 text-zinc-500 rounded-2xl py-4 text-[16px] font-medium active:scale-[0.98] hover:bg-zinc-100 transition-all duration-150 mt-1"
      >
        Daha sonra
      </button>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  hint,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl px-4 py-3.5">
      <div className="w-8 h-8 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0 text-[12px] font-bold text-zinc-400">
        {number}
      </div>
      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-800 leading-snug">
          {title}
        </p>
        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
          {hint}
        </p>
      </div>
    </div>
  );
}

/* ── Inline SVG icons matching iOS/Safari UI conventions ── */

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1" fill="#3B82F6" />
      <circle cx="12" cy="12" r="1" fill="#3B82F6" />
      <circle cx="19" cy="12" r="1" fill="#3B82F6" />
    </svg>
  );
}

function AddHomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function AddButtonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
