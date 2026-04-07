import { useState, useEffect } from "react";

const USER_TICKS = 25;
const USER_TICK_MS = 22;

function useUserTypingEffect(text: string) {
  const total = text.length;
  const charsPerTick = Math.max(1, Math.ceil(total / USER_TICKS));
  const [length, setLength] = useState(0);

  useEffect(() => {
    setLength(0);
    const timer = setInterval(() => {
      setLength((prev) => {
        const next = Math.min(prev + charsPerTick, total);
        return next;
      });
    }, USER_TICK_MS);
    return () => clearInterval(timer);
  }, [text, total, charsPerTick]);

  return text.slice(0, length);
}

export function OptimisticUserBubble({ content }: { content: string }) {
  const displayed = useUserTypingEffect(content);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`flex justify-end transition-all duration-200 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="max-w-[82%] px-5 py-3.5 text-[15px] leading-relaxed bg-zinc-900 text-white rounded-3xl rounded-tr-sm shadow-sm min-h-[48px]">
        {displayed}
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-white/40 align-middle animate-pulse" />
      </div>
    </div>
  );
}
