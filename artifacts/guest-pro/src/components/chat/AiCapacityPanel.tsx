/**
 * Shown when Gemini capacity is exhausted — guides guest to quick actions (no error toast).
 */

import { UtensilsCrossed, Bell, MessageSquare, Heart, ArrowRight } from "lucide-react";
import type { QuickActionRoute } from "@/lib/chat-api";

const ROUTE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  food: UtensilsCrossed,
  support: Bell,
  info: MessageSquare,
  care: Heart,
};

interface AiCapacityPanelProps {
  title: string;
  subtitle: string;
  routes: QuickActionRoute[];
  onNavigate: (route: QuickActionRoute) => void;
}

export function AiCapacityPanel({ title, subtitle, routes, onNavigate }: AiCapacityPanelProps) {
  return (
    <div className="mx-1 mb-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <p className="text-[13px] font-semibold text-amber-900">{title}</p>
      <p className="text-[12px] text-amber-800/90 mt-1 leading-relaxed">{subtitle}</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {routes.map((route) => {
          const Icon = ROUTE_ICONS[route.id] ?? MessageSquare;
          return (
            <button
              key={route.id}
              type="button"
              onClick={() => onNavigate(route)}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white border border-amber-100 text-left hover:border-amber-300 active:scale-[0.98] transition-all shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-700" />
              </div>
              <span className="text-[12px] font-medium text-zinc-800 leading-tight flex-1">
                {route.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
