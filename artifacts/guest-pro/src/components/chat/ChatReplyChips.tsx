import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatReplyChipsProps {
  options: string[];
  onSelect: (label: string) => void;
  disabled?: boolean;
}

const chipSpring = { type: "spring" as const, stiffness: 420, damping: 30, mass: 0.85 };

export function ChatReplyChips({ options, onSelect, disabled }: ChatReplyChipsProps) {
  const reduceMotion = useReducedMotion();

  if (options.length === 0) return null;

  return (
    <motion.div
      className="mt-3 max-w-[92%] pl-0.5"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.82, 0.35, 1] }}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((label, index) => (
          <motion.button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(label)}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              ...chipSpring,
              delay: reduceMotion ? 0 : index * 0.05,
            }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={cn(
              "rounded-[14px] border border-zinc-200/80 bg-white/95 px-3.5 py-2",
              "text-[13px] font-medium leading-snug tracking-tight text-zinc-700",
              "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-6px_rgba(0,0,0,0.08)]",
              "backdrop-blur-sm transition-colors duration-200",
              "hover:border-zinc-300/90 hover:bg-zinc-50/90 hover:text-zinc-900",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            {label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
