/** Strip quotes from API keys / secrets set in Railway with accidental wrapping. */
export function normalizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

/** Strip quotes and spaces from secrets (e.g. Gmail app passwords → 16 chars). */
export function normalizeAppPassword(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/\s+/g, "");
}
