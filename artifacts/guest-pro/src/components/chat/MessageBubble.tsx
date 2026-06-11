import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, useReducedMotion } from "framer-motion";
import type { Message } from "@workspace/api-client-react";
import { stripAiMarkup } from "@/lib/chat-sanitize";
import { getRoadmapFromMessage } from "@/lib/chat-roadmap";
import { ChatRoadmapCard } from "@/components/guest/ChatRoadmapCard";

interface MessageBubbleProps {
  message: Message;
  animate?: boolean;
}

const bubbleSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

function useTypingEffect(text: string, active: boolean) {
  const [displayedLength, setDisplayedLength] = useState(active ? 0 : text.length);
  const isDone = displayedLength >= text.length;

  useEffect(() => {
    if (!active) {
      setDisplayedLength(text.length);
      return;
    }

    setDisplayedLength(0);

    const TICKS = 50;
    const TICK_INTERVAL_MS = 40;
    const charsPerTick = Math.max(1, Math.ceil(text.length / TICKS));

    const timer = setInterval(() => {
      setDisplayedLength((prev) => Math.min(prev + charsPerTick, text.length));
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [text, active]);

  return { displayed: text.slice(0, displayedLength), isDone };
}

function AIMessageContent({ content, animate }: { content: string; animate: boolean }) {
  const { displayed, isDone } = useTypingEffect(content, animate);
  const cursorVisible = animate && !isDone;

  return (
    <div className="relative">
      {isDone ? (
        <div className="prose prose-sm prose-zinc max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-headings:my-2 prose-strong:font-semibold prose-a:text-zinc-600 prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-800">
          {displayed}
          {cursorVisible && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-400 align-middle" />
          )}
        </p>
      )}
    </div>
  );
}

export function MessageBubble({ message, animate = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const displayContent = isAssistant ? stripAiMarkup(message.content) : message.content;
  const roadmap = isAssistant ? getRoadmapFromMessage(message) : null;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 14,
              x: isUser ? 10 : -10,
              scale: 0.97,
            }
      }
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={bubbleSpring}
    >
      {isUser && (
        <div
          className="max-w-[82%] rounded-[22px] rounded-br-[6px] bg-zinc-900 px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),0_8px_20px_-8px_rgba(0,0,0,0.25)]"
        >
          {message.content}
        </div>
      )}

      {isAssistant && (
        <div className="max-w-[92%] space-y-0">
          <div className="rounded-[22px] rounded-bl-[6px] border border-zinc-100/90 bg-white px-4 py-3.5 text-[15px] leading-relaxed text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_-8px_rgba(0,0,0,0.1)]">
            <AIMessageContent content={displayContent || message.content} animate={animate} />
          </div>
          {roadmap && <ChatRoadmapCard roadmap={roadmap} />}
        </div>
      )}
    </motion.div>
  );
}
