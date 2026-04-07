export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-zinc-100 rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
            style={{ animationDelay: "200ms", animationDuration: "1.2s" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
            style={{ animationDelay: "400ms", animationDuration: "1.2s" }}
          />
        </div>
      </div>
    </div>
  );
}
