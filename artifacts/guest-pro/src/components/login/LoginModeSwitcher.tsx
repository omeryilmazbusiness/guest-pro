/**
 * LoginModeSwitcher — iOS-style liquid glass segmented control for login.
 */

import { useCallback } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LoginMode } from "./login-mode";
import { LABEL_SPRING, PILL_SPRING } from "./login-motion";

interface TabConfig {
  id: LoginMode;
  label: string;
  testId: string;
  panelId: string;
}

const TABS: TabConfig[] = [
  { id: "guest", label: "Guest Key", testId: "tab-guest", panelId: "panel-guest" },
  { id: "manager", label: "Staff", testId: "tab-manager", panelId: "panel-manager" },
];

interface LoginModeSwitcherProps {
  mode: LoginMode;
  onModeChange: (mode: LoginMode) => void;
  className?: string;
}

export function LoginModeSwitcher({ mode, onModeChange, className }: LoginModeSwitcherProps) {
  const reduceMotion = useReducedMotion();

  const select = useCallback(
    (next: LoginMode) => {
      if (next === mode) return;
      onModeChange(next);
    },
    [mode, onModeChange],
  );

  const pillTransition = reduceMotion ? { duration: 0.12 } : PILL_SPRING;

  return (
    <LayoutGroup id="login-mode-switcher">
      <div
        role="tablist"
        aria-label="Login type"
        className={cn(
          "relative flex gap-1 rounded-2xl p-1.5",
          "bg-zinc-100/90 border border-zinc-200/60",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
          className,
        )}
      >
        <span
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
          aria-hidden
        />

        {TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              data-testid={tab.testId}
              aria-selected={active}
              aria-controls={tab.panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const idx = TABS.findIndex((t) => t.id === tab.id);
                  const next = e.key === "ArrowRight" ? TABS[idx + 1] : TABS[idx - 1];
                  if (next) select(next.id);
                }
              }}
              whileTap={reduceMotion ? undefined : { scale: active ? 0.99 : 0.96 }}
              transition={LABEL_SPRING}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center rounded-2xl py-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              )}
            >
              {active && (
                <motion.span
                  layoutId="login-glass-pill"
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    "border border-zinc-100/90 bg-white",
                    "shadow-sm",
                  )}
                  transition={pillTransition}
                  style={{ willChange: "transform" }}
                />
              )}
              <motion.span
                className="relative z-10 text-sm font-semibold tracking-tight"
                animate={{
                  opacity: active ? 1 : 0.55,
                  scale: active ? 1 : 0.97,
                  color: active ? "rgb(24 24 27)" : "rgb(113 113 122)",
                }}
                transition={reduceMotion ? { duration: 0.12 } : LABEL_SPRING}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
