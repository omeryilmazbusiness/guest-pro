import { Share, Plus, MoreHorizontal, Download, X } from "lucide-react";
import type { UseInstallPromptReturn } from "@/hooks/use-install-prompt";

interface Props {
  install: UseInstallPromptReturn;
}

export function InstallSheet({ install }: Props) {
  const { showSheet, canNativeInstall, isIOSDevice, triggerInstall, dismiss } =
    install;

  if (!showSheet) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={() => dismiss(false)}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Guest Pro to Home Screen"
        className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300"
      >
        <div className="bg-white rounded-t-[28px] shadow-2xl mx-0 pb-safe">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-200" />
          </div>

          <div className="px-6 pt-5 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-[60px] h-[60px] rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/20 shrink-0">
                  <svg
                    width="32"
                    height="32"
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
                    <circle cx="96" cy="130" r="6" fill="white" opacity="0.45" />
                    <circle cx="96" cy="130" r="3" fill="white" opacity="0.9" />
                  </svg>
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-zinc-900 leading-tight">
                    Add to Home Screen
                  </p>
                  <p className="text-[13px] text-zinc-400 mt-0.5 leading-relaxed">
                    Guest Pro · Your AI concierge
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismiss(false)}
                className="text-zinc-300 hover:text-zinc-500 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[14px] text-zinc-500 leading-relaxed mb-7">
              Get instant access to your concierge from your home screen — no
              browser bar, full-screen, just like a native app.
            </p>

            {canNativeInstall ? (
              <NativeInstallCTA onInstall={triggerInstall} onDismiss={() => dismiss(false)} />
            ) : isIOSDevice ? (
              <IOSInstructions onDismiss={() => dismiss(false)} />
            ) : (
              <FallbackInstructions onDismiss={() => dismiss(false)} />
            )}

            <button
              onClick={() => dismiss(true)}
              className="w-full text-center text-[12px] text-zinc-300 hover:text-zinc-400 transition-colors mt-5 py-1"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </>
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
        Add to Home Screen
      </button>
      <button
        onClick={onDismiss}
        className="w-full bg-zinc-50 text-zinc-500 rounded-2xl py-4 text-[16px] font-medium active:scale-[0.98] hover:bg-zinc-100 transition-all duration-150"
      >
        Maybe later
      </button>
    </div>
  );
}

function IOSInstructions({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    {
      icon: <Share className="w-4 h-4 text-blue-500" />,
      label: "Tap the Share button",
      sub: "The box with an arrow, at the bottom of Safari",
    },
    {
      icon: <Plus className="w-4 h-4 text-blue-500" />,
      label: 'Choose "Add to Home Screen"',
      sub: "Scroll down in the share sheet to find it",
    },
    {
      icon: (
        <span className="text-[13px] font-semibold text-blue-500 leading-none">
          Add
        </span>
      ),
      label: "Tap Add to confirm",
      sub: "Guest Pro will appear on your home screen",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-zinc-50 rounded-2xl p-4 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div>
              <p className="text-[14px] font-medium text-zinc-800">
                {step.label}
              </p>
              <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">
                {step.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="w-full bg-zinc-50 text-zinc-500 rounded-2xl py-4 text-[16px] font-medium active:scale-[0.98] hover:bg-zinc-100 transition-all duration-150"
      >
        Maybe later
      </button>
    </div>
  );
}

function FallbackInstructions({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    {
      icon: <MoreHorizontal className="w-4 h-4 text-zinc-500" />,
      label: "Open your browser menu",
      sub: "Look for the three-dot menu or share icon",
    },
    {
      icon: <Plus className="w-4 h-4 text-zinc-500" />,
      label: 'Select "Add to Home Screen"',
      sub: "Or 'Install app' depending on your browser",
    },
    {
      icon: (
        <span className="text-[12px] font-semibold text-zinc-500 leading-none">
          OK
        </span>
      ),
      label: "Confirm installation",
      sub: "Guest Pro will appear on your home screen",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-zinc-50 rounded-2xl p-4 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div>
              <p className="text-[14px] font-medium text-zinc-800">
                {step.label}
              </p>
              <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">
                {step.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="w-full bg-zinc-50 text-zinc-500 rounded-2xl py-4 text-[16px] font-medium active:scale-[0.98] hover:bg-zinc-100 transition-all duration-150"
      >
        Maybe later
      </button>
    </div>
  );
}
