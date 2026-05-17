/**
 * mrz-names.ts — TD3 line-1 name extraction and OCR stutter cleanup.
 *
 * Names are parsed from the MRZ name field (authoritative) rather than relying
 * solely on the mrz library fields, which amplify OCR repetition noise.
 */

const TD3_LINE_LEN = 44;

function normalizeTd3Line(line: string): string {
  let s = line
    .replace(/\s+/g, "")
    .toUpperCase()
    .replace(/«|»/g, "<");
  if (s.length > TD3_LINE_LEN) s = s.slice(0, TD3_LINE_LEN);
  if (s.length < TD3_LINE_LEN) s = s.padEnd(TD3_LINE_LEN, "<");
  return s;
}

function toTitleCase(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Known valid doubled letter pairs in ICAO transliterated names. */
const VALID_NAME_DOUBLES = new Set([
  "SS", "NN", "LL", "EE", "MM", "TT", "FF", "PP", "CC", "DD", "GG", "BB",
]);

/**
 * Collapse OCR stutter runs (3+ same letter).
 * Keeps a double only when that pair is a known valid name double (e.g. SS, NN).
 */
export function collapseOcrStutter(word: string): string {
  return word.replace(/(.)\1+/g, (run, ch: string) => {
    const n = run.length;
    if (n === 2) return run;
    const pair = ch + ch;
    if (n === 3 && VALID_NAME_DOUBLES.has(pair)) return pair;
    return ch;
  });
}

function isPlausibleNameToken(word: string): boolean {
  if (word.length < 2 || word.length > 39) return false;
  const counts = new Map<string, number>();
  for (const c of word) counts.set(c, (counts.get(c) ?? 0) + 1);
  const max = Math.max(...counts.values());
  if (max / word.length > 0.75) return false;
  return /^[A-Z]+$/.test(word);
}

/**
 * Sanitize a single MRZ name segment (surname or given-name group).
 */
export function sanitizeMrzNamePart(raw: string): string {
  const normalized = raw
    .toUpperCase()
    .replace(/[^A-Z<]/g, "")
    .replace(/</g, " ")
    .trim();

  if (!normalized) return "";

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map(collapseOcrStutter)
    .filter(isPlausibleNameToken)
    .map(toTitleCase)
    .join(" ");
}

/** Fix common OCR digit→letter confusions in TD3 line-1 name field only. */
export function repairTd3Line1NameField(line: string): string {
  const base = normalizeTd3Line(line);
  const prefix = base.slice(0, 5);
  let names = base.slice(5, 44);

  names = names
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/[^A-Z<]/g, "<");

  names = names.replace(/<{3,}/g, "<<");

  return normalizeTd3Line(prefix + names);
}

/**
 * Parse surname and given names from TD3 line 1 (positions 5–43).
 * Format: SURNAME<<GIVEN<NAMES separated by <
 */
export function parseNamesFromTd3Line1(line1: string): {
  lastName: string;
  firstName: string;
} | null {
  const line = repairTd3Line1NameField(line1);
  const namesField = line.slice(5, 44).replace(/<+$/g, "");

  const sepIdx = namesField.indexOf("<<");
  let lastRaw: string;
  let firstRaw: string;

  if (sepIdx >= 0) {
    lastRaw = namesField.slice(0, sepIdx);
    firstRaw = namesField.slice(sepIdx + 2);
  } else {
    const parts = namesField.split("<").filter(Boolean);
    if (parts.length < 2) return null;
    lastRaw = parts[0]!;
    firstRaw = parts.slice(1).join(" ");
  }

  const lastName = sanitizeMrzNamePart(lastRaw);
  const firstName = sanitizeMrzNamePart(
    firstRaw.replace(/<+/g, " ").replace(/\s+/g, " ").trim(),
  );

  if (!lastName || !firstName) return null;
  if (lastName.length < 2 || firstName.length < 2) return null;

  return { lastName, firstName };
}
