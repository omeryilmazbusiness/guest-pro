/**
 * mrz-parser.ts — MRZ extraction and PassportData mapping from OCR text.
 */

import { parse } from "mrz";
import type { PassportData } from "./types";
import { TD3_LINE_LEN } from "./ocr-preprocess";

// ── Public result types ──────────────────────────────────────────────────────

export type MrzAssessStatus =
  | "no_text"
  | "no_mrz"
  | "invalid"
  | "valid_checksum"
  | "valid_fields";

export interface MrzAssessResult {
  status: MrzAssessStatus;
  data: PassportData | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseMrzDate(yymmdd: string, isBirth: boolean): string {
  if (!yymmdd || yymmdd.length !== 6) return "";
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const year = isBirth
    ? yy >= 30
      ? 1900 + yy
      : 2000 + yy
    : yy < 30
      ? 2000 + yy
      : 1900 + yy;
  return `${year}-${mm}-${dd}`;
}

function toTitleCase(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function cleanMrzLine(line: string): string {
  return line
    .replace(/\s+/g, "")
    .toUpperCase()
    .replace(/«|»/g, "<");
}

/** Pad or trim to TD3 line length (44). */
export function normalizeTd3Line(line: string): string {
  let s = cleanMrzLine(line);
  if (s.length > TD3_LINE_LEN) s = s.slice(0, TD3_LINE_LEN);
  if (s.length < TD3_LINE_LEN) s = s.padEnd(TD3_LINE_LEN, "<");
  return s;
}

function mapSex(sex: string | null | undefined): string {
  if (!sex) return "";
  const s = sex.toLowerCase();
  if (s === "male" || s === "m") return "M";
  if (s === "female" || s === "f") return "F";
  return "X";
}

/** Nationality (alpha-3) from TD3 line 2 when parser leaves it null */
function nationalityFromLine2(line2: string): string {
  if (line2.length < 13) return "";
  return line2.slice(10, 13).replace(/</g, "");
}

type MrzFields = ReturnType<typeof parse>["fields"];

function fieldsToPassport(
  fields: MrzFields,
  lines: [string, string],
  relaxed: boolean,
): PassportData | null {
  const firstName = (fields.firstName ?? "")
    .split(" ")
    .filter(Boolean)
    .map(toTitleCase)
    .join(" ");

  const lastName = toTitleCase(fields.lastName ?? "");
  const passportNumber = (fields.documentNumber ?? "").replace(/</g, "").trim();
  const nationality =
    (fields.nationality ?? "").toUpperCase().replace(/</g, "") ||
    nationalityFromLine2(lines[1]);

  if (!lastName || !firstName) return null;
  if (!passportNumber || passportNumber.length < 6) return null;
  if (!nationality || nationality.length !== 3) {
    if (!relaxed) return null;
    if (nationality.length < 3) return null;
  }

  const dateOfBirth = parseMrzDate(fields.birthDate ?? "", true);
  const expiryDate = parseMrzDate(fields.expirationDate ?? "", false);

  if (!relaxed && (!dateOfBirth || !expiryDate)) return null;
  if (relaxed && !dateOfBirth) return null;

  return {
    firstName,
    lastName,
    nationality,
    dateOfBirth,
    passportNumber,
    expiryDate: expiryDate || "",
    gender: mapSex(fields.sex),
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function extractMrzLines(ocrText: string): string[] | null {
  const lines = ocrText
    .split("\n")
    .map((l) => cleanMrzLine(l))
    .filter((l) => l.length >= 30 && /^[A-Z0-9<]+$/.test(l));

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].length >= 38 && lines[i + 1].length >= 38) {
      return [lines[i], lines[i + 1]];
    }
  }

  if (lines.length >= 2) return [lines[0], lines[1]];
  return null;
}

/**
 * Assess OCR output — drives frame colour and lock logic.
 */
export function assessMrzText(ocrText: string): MrzAssessResult {
  const trimmed = ocrText.replace(/\s/g, "");
  if (trimmed.length < 24) {
    return { status: "no_text", data: null };
  }

  const rawLines = extractMrzLines(ocrText);
  if (!rawLines) {
    return { status: "no_mrz", data: null };
  }

  const lines: [string, string] = [
    normalizeTd3Line(rawLines[0]),
    normalizeTd3Line(rawLines[1]),
  ];

  try {
    const result = parse(lines, { autocorrect: true });

    if (result.valid) {
      const data = fieldsToPassport(result.fields, lines, false);
      if (data) return { status: "valid_checksum", data };
    }

    const relaxed = fieldsToPassport(result.fields, lines, true);
    if (relaxed) return { status: "valid_fields", data: relaxed };

    return { status: "invalid", data: null };
  } catch {
    return { status: "invalid", data: null };
  }
}

/** @deprecated Use assessMrzText — kept for tests */
export function parseMrzText(ocrText: string): PassportData | null {
  const r = assessMrzText(ocrText);
  if (r.status === "valid_checksum" || r.status === "valid_fields") return r.data;
  return null;
}
