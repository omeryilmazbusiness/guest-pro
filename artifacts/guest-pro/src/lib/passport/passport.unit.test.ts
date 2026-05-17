/**
 * Passport scan unit tests.
 * Run: pnpm --filter @workspace/guest-pro test
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PASSPORT_PAGE_ASPECT,
  computePassportFrameRect,
  viewportRectToVideoCrop,
  MRZ_BAND_FRAC,
} from "./frame-geometry";
import {
  assessMrzText,
  extractMrzLines,
  normalizeTd3Line,
  parseMrzText,
} from "./mrz-parser";
import { encodePassportQr, decodePassportQr, PASSPORT_QR_VERSION } from "./types";

const SAMPLE_OCR = `
P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C<3UTO7408122F1204159ZEIA184226B<<<<<
`;

describe("frame-geometry", () => {
  it("computes horizontal frame with passport aspect ratio", () => {
    const rect = computePassportFrameRect(390, 844);
    const aspect = rect.width / rect.height;
    assert.ok(Math.abs(aspect - PASSPORT_PAGE_ASPECT) < 0.01);
    assert.ok(rect.width > 360);
  });

  it("maps viewport MRZ band into video crop", () => {
    const frame = computePassportFrameRect(390, 844);
    const crop = viewportRectToVideoCrop(frame, 390, 844, 1920, 1080, "mrz");
    assert.ok(crop.sw > 0 && crop.sh > 0);
    const full = viewportRectToVideoCrop(frame, 390, 844, 1920, 1080, "full");
    assert.ok(crop.sh < full.sh);
  });

  it("exports MRZ band fraction in valid range", () => {
    assert.ok(MRZ_BAND_FRAC > 0.2 && MRZ_BAND_FRAC < 0.5);
  });
});

describe("mrz-parser", () => {
  it("normalizes TD3 lines to 44 characters", () => {
    assert.equal(normalizeTd3Line("ABC").length, 44);
    assert.equal(normalizeTd3Line("X".repeat(50)).length, 44);
  });

  it("extracts two MRZ lines from noisy OCR text", () => {
    const lines = extractMrzLines(SAMPLE_OCR);
    assert.ok(lines);
    assert.equal(lines!.length, 2);
  });

  it("assesses sample OCR as valid_fields (checksum may fail)", () => {
    const r = assessMrzText(SAMPLE_OCR);
    assert.ok(r.status === "valid_fields" || r.status === "valid_checksum");
    assert.ok(r.data);
    assert.equal(r.data!.lastName, "Eriksson");
    assert.ok(r.data!.firstName.includes("Anna"));
  });

  it("parseMrzText returns data for readable MRZ", () => {
    const data = parseMrzText(SAMPLE_OCR);
    assert.ok(data);
    assert.equal(data!.nationality, "UTO");
  });

  it("returns no_text for garbage input", () => {
    assert.equal(assessMrzText("hello").status, "no_text");
  });
});

describe("types QR codec", () => {
  it("round-trips PassportData through QR JSON", () => {
    const original = {
      firstName: "Anna Maria",
      lastName: "Eriksson",
      nationality: "UTO",
      dateOfBirth: "1974-08-12",
      passportNumber: "L898902C3",
      expiryDate: "2012-04-15",
      gender: "F",
    };
    const encoded = encodePassportQr(original);
    const decoded = decodePassportQr(encoded);
    assert.deepEqual(decoded, original);
    const payload = JSON.parse(encoded) as { v: number };
    assert.equal(payload.v, PASSPORT_QR_VERSION);
  });
});
