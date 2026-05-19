/**
 * LoginTabPanel — animated cross-fade / slide for login form panels.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LoginMode } from "./login-mode";
import { IOS_EASE, PANEL_FADE, PANEL_SPRING } from "./login-motion";

const panelVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 22,
    scale: 0.965,
    filter: "blur(10px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -16,
    scale: 0.98,
    filter: "blur(6px)",
  }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

interface LoginTabPanelProps {
  mode: LoginMode;
  slideDirection: number;
  children: React.ReactNode;
}

export function LoginTabPanel({ mode, slideDirection, children }: LoginTabPanelProps) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? reducedVariants : panelVariants;

  return (
    <div className="relative min-h-[12.5rem] overflow-visible px-1 -mx-1">
      <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
        <motion.div
          key={mode}
          role="tabpanel"
          id={mode === "guest" ? "panel-guest" : "panel-manager"}
          aria-labelledby={mode === "guest" ? "tab-guest" : "tab-manager"}
          custom={slideDirection}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ willChange: "transform, opacity, filter" }}
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : {
                  x: PANEL_SPRING,
                  scale: PANEL_SPRING,
                  opacity: PANEL_FADE,
                  filter: { duration: 0.32, ease: IOS_EASE },
                }
          }
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Direction for panel slide: +1 = toward staff, -1 = toward guest. */
export function getLoginSlideDirection(from: LoginMode, to: LoginMode): number {
  if (from === to) return 0;
  return to === "manager" ? 1 : -1;
}
