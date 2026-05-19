/** Strip leaked AI markup from message text shown to guests. */
const ACTION_BLOCK_RE = /<ACTION>\s*[\s\S]*?\s*<\/ACTION>/gi;
const ACTION_OPEN_RE = /<ACTION>\s*[\s\S]*$/i;
const ACTION_CLOSE_RE = /<\/ACTION>/gi;
const OPTIONS_BLOCK_RE = /<OPTIONS>\s*[\s\S]*?\s*<\/OPTIONS>/gi;
const OPTIONS_OPEN_RE = /<OPTIONS>\s*[\s\S]*$/i;

export function stripActionMarkup(raw: string): string {
  return raw
    .replace(ACTION_BLOCK_RE, "")
    .replace(ACTION_OPEN_RE, "")
    .replace(ACTION_CLOSE_RE, "")
    .trim();
}

export function stripAiMarkup(raw: string): string {
  return raw
    .replace(ACTION_BLOCK_RE, "")
    .replace(ACTION_OPEN_RE, "")
    .replace(ACTION_CLOSE_RE, "")
    .replace(OPTIONS_BLOCK_RE, "")
    .replace(OPTIONS_OPEN_RE, "")
    .replace(/<\/OPTIONS>/gi, "")
    .trim();
}
