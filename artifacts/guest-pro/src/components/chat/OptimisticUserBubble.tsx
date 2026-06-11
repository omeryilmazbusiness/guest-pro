import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

const USER_TICKS = 25;
const USER_TICK_MS = 22;

const bubbleSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 32,
  mass: 0.88,
};

function useUserTypingEffect(text: string) {
  const total = text.length;
  const charsPerTick = Math.max(1, Math.ceil(total / USER_TICKS));
  const [length, setLength] = useState(0);

  useEffect(() => {
    setLength(0);
    const timer = setInterval(() => {
      setLength((prev) => Math.min(prev + charsPerTick, total));
    }, USER_TICK_MS);
    return () => clearInterval(timer);
  }, [text, total, charsPerTick]);

  return text.slice(0, length);
}

export function OptimisticUserBubble({ content }: { content: string }) {
  const displayed = useUserTypingEffect(content);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex justify-end"
      initial={reduceMotion ? false : { opacity: 0, y: 12, x: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={bubbleSpring}
    >
      <div className="min-h-[48px] max-w-[82%] rounded-[22px] rounded-br-[6px] bg-zinc-900 px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),0_8px_20px_-8px_rgba(0,0,0,0.25)]">
        {displayed}
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/40 align-middle" />
      </div>
    </motion.div>
  );
}
