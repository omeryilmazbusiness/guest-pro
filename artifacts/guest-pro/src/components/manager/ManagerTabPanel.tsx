/**
 * ManagerTabPanel — animated tab content wrapper (iOS-style crossfade + slide).
 */

import { AnimatePresence, motion } from "framer-motion";
import { PANEL_FADE, IOS_EASE } from "@/lib/manager-motion";

interface ManagerTabPanelProps {
  tabKey: string;
  children: React.ReactNode;
}

export function ManagerTabPanel({ tabKey, children }: ManagerTabPanelProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ ...PANEL_FADE, ease: IOS_EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
