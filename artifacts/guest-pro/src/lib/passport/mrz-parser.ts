/**
 * mrz-parser.ts
 *
 * Thin, testable wrapper around the `mrz` npm package.
 * Accepts raw OCR text (multi-line) and returns a PassportData or null.
 *
 * Responsibilities (Single Responsibility):
 *  - Extract MRZ lines from raw OCR output
 *  - Parse with the mrz library
 *  - Normalise dates to YYYY-MM-DD
 *  - Return typed PassportData or null on failure
 */

import { parse } from "mrz";
import type { PassportData } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * MRZ dates are encoded as YYMMDD.
 * For date-of-birth: years >= 30 are treated as 19xx (born before 2030).
 * For expiry: years < 30 are treated as 20xx (expiring after 2000).
 */
function parseMrzDate(yymmdd: string, isBirth: boolean): string {
  if (!yymmdd || yymmdd.length !== 6) return "";
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const year = isBirth
    ? yy >= 30 ? 1900 + yy : 2000 + yy
    : yy < 30 ? 2000 + yy : 1900 + yy;
  return `${year}-${mm}-${dd}`;
}

/** Capitalise first letter, lowercase the rest — for name segments */
function toTitleCase(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Clean OCR noise from a potential MRZ line */
function cleanMrzLine(line: string): string {
  // Replace common OCR mistakes: O→0 in numeric fields is handled by mrz lib
  return line.replace(/\s+/g, "").toUpperCase();
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract two or three consecutive MRZ lines from raw OCR text.
 * TD3 (passport) = 2 lines of 44 chars each.
 */
export function extractMrzLines(ocrText: string): string[] | null {
  const lines = ocrText
    .split("\n")
    .map((l) => cleanMrzLine(l))
    .filter((l) => l.length >= 30 && /^[A-Z0-9<]+$/.test(l));

  // Find two consecutive lines of ~44 chars (TD3 passport format)
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].length >= 40 && lines[i + 1].length >= 40) {
      return [lines[i], lines[i + 1]];
    }
  }

  // Fallback: any two MRZ-looking lines
  if (lines.length >= 2) return [lines[0], lines[1]];

  return null;
}

/**
 * Parse raw OCR text → PassportData.
 * Returns null if no valid MRZ found or parsing fails.
 */
export function parseMrzText(ocrText: string): PassportData | null {
  const mrzLines = extractMrzLines(ocrText);
  if (!mrzLines) return null;

  try {
    const result = parse(mrzLines);
    if (!result.valid) return null;

    const fields = result.fields;

    const firstName = (fields.firstName ?? "")
      .split(" ")
      .filter(Boolean)
      .map(toTitleCase)
      .join(" ");

    const lastName = toTitleCase(fields.lastName ?? "");

    if (!firstName || !lastName) return null;

    return {
      firstName,
      lastName,
      nationality: (fields.nationality ?? "").toUpperCase(),
      dateOfBirth: parseMrzDate(fields.birthDate ?? "", true),
      passportNumber: fields.documentNumber ?? "",
      expiryDate: parseMrzDate(fields.expirationDate ?? "", false),
      gender: fields.sex ?? "",
    };
  } catch {
    return null;
  }
}
