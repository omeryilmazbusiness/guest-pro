/** Strip markdown / markup before sending text to TTS providers. */
export function sanitizeTextForTts(text: string, maxLength: number): string {
  const clean = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~#>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}
