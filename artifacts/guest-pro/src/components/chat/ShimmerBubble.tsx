import { motion, useReducedMotion } from "framer-motion";

export function ShimmerBubble() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex justify-start"
      initial={reduceMotion ? false : { opacity: 0, y: 10, x: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <div className="relative w-48 max-w-[72%] overflow-hidden rounded-[22px] rounded-bl-[6px] border border-zinc-100/90 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_-8px_rgba(0,0,0,0.1)]">
        <div className="relative h-14 overflow-hidden bg-zinc-100">
          <div className="shimmer-sweep absolute inset-0" />
        </div>
      </div>
    </motion.div>
  );
}
