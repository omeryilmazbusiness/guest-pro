import { Eye, EyeOff } from "lucide-react";

export function RevealToggle({
  revealed,
  onToggle,
  label,
}: {
  revealed: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      {revealed ? (
        <EyeOff className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Eye className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}
