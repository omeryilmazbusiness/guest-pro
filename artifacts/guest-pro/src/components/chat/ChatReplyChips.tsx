/**
 * Tap-to-continue chips shown below the latest assistant message.
 */

interface ChatReplyChipsProps {
  options: string[];
  onSelect: (label: string) => void;
  disabled?: boolean;
}

export function ChatReplyChips({ options, onSelect, disabled }: ChatReplyChipsProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 pl-1 max-w-[88%] animate-in fade-in slide-in-from-bottom-1 duration-300">
      {options.map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(label)}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80 hover:bg-zinc-200/80 hover:border-zinc-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
