import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@workspace/api-client-react/generated/api.schemas";

interface MessageBubbleProps {
  message: Message;
  animate?: boolean;
}

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
      setDisplayedLength((prev) => {
        const next = Math.min(prev + charsPerTick, text.length);
        return next;
      });
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
        <p className="text-[15px] leading-relaxed text-zinc-800 whitespace-pre-wrap">
          {displayed}
          {cursorVisible && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-zinc-400 align-middle animate-pulse" />
          )}
        </p>
      )}
    </div>
  );
}

export function MessageBubble({ message, animate = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`flex transition-all duration-300 ease-out ${
        isUser ? "justify-end" : "justify-start"
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      {isUser && (
        <div className="max-w-[82%] px-5 py-3.5 text-[15px] leading-relaxed bg-zinc-900 text-white rounded-3xl rounded-tr-sm shadow-sm">
          {message.content}
        </div>
      )}

      {isAssistant && (
        <div className="max-w-[88%] px-5 py-4 text-[15px] leading-relaxed bg-white text-zinc-800 rounded-3xl rounded-tl-sm border border-zinc-100 shadow-sm">
          <AIMessageContent content={message.content} animate={animate} />
        </div>
      )}
    </div>
  );
}
