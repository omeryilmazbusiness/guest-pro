import { UtensilsCrossed, Bell, Heart } from "lucide-react";

export type QuickActionMode = "food" | "support" | "care";

interface QuickAction {
  mode: QuickActionMode;
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
  accent: string;
  iconBg: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    mode: "food",
    icon: UtensilsCrossed,
    title: "Acıktım",
    subtitle: "Odaya servis",
    accent: "border-amber-100",
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-500",
  },
  {
    mode: "support",
    icon: Bell,
    title: "Destek Talep",
    subtitle: "Bir sorun mu var?",
    accent: "border-yellow-100",
    iconBg: "bg-yellow-50 border-yellow-100",
    iconColor: "text-yellow-500",
  },
  {
    mode: "care",
    icon: Heart,
    title: "Care about me",
    subtitle: "Tercihleriniz",
    accent: "border-rose-100",
    iconBg: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-400",
  },
];

interface ServiceQuickActionsProps {
  onAction: (mode: QuickActionMode) => void;
}

export function ServiceQuickActions({ onAction }: ServiceQuickActionsProps) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
        Hızlı Hizmetler
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.mode}
              onClick={() => onAction(action.mode)}
              className={`bg-white border ${action.accent} rounded-2xl px-3 py-4 flex flex-col items-center text-center shadow-sm active:scale-[0.96] hover:shadow-md transition-all duration-150 group`}
            >
              <div
                className={`w-10 h-10 rounded-xl border ${action.iconBg} flex items-center justify-center mb-3 transition-transform group-active:scale-95`}
              >
                <Icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <p className="text-[13px] font-semibold text-zinc-800 leading-tight">{action.title}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">{action.subtitle}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
