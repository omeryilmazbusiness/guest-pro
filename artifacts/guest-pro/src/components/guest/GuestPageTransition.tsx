import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  GUEST_PAGE_FADE,
  GUEST_PAGE_SPRING,
  guestNavDirection,
} from "@/lib/guest-motion";

interface GuestPageTransitionProps {
  children: React.ReactNode;
}

/**
 * iOS-style push/pop transition for guest screens (home, chat, flow).
 */
export function GuestPageTransition({ children }: GuestPageTransitionProps) {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const prevPath = useRef(location);
  const direction = guestNavDirection(prevPath.current, location);

  useEffect(() => {
    prevPath.current = location;
  }, [location]);

  if (reduceMotion) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          className="min-h-[100dvh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const isForward = direction === "forward";
  const enterX = isForward ? 36 : -28;
  const exitX = isForward ? -22 : 28;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        className="min-h-[100dvh] will-change-transform"
        initial={{ opacity: 0, x: enterX, scale: 0.988, filter: "blur(4px)" }}
        animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: exitX, scale: 0.992, filter: "blur(3px)" }}
        transition={{
          ...GUEST_PAGE_SPRING,
          opacity: GUEST_PAGE_FADE,
          filter: { duration: 0.35, ease: GUEST_PAGE_FADE.ease },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
