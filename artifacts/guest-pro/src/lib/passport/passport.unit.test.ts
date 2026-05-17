/**
 * Passport scan unit tests (frame geometry, MRZ parse, QR codec).
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
import { extractMrzLines, parseMrzText } from "./mrz-parser";
import { encodePassportQr, decodePassportQr, PASSPORT_QR_VERSION } from "./types";

// ICAO 9303 TD3 sample — line 2 trimmed to 44 chars (TD3 requirement)
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
    assert.ok(rect.x >= 0);
    assert.ok(rect.y >= 0);
  });

  it("caps frame height on short viewports", () => {
    const rect = computePassportFrameRect(390, 500);
    assert.ok(rect.height <= 500 * 0.56 + 1);
  });

  it("maps viewport MRZ band into video crop (object-cover)", () => {
    const frame = computePassportFrameRect(390, 844);
    const crop = viewportRectToVideoCrop(frame, 390, 844, 1920, 1080, "mrz");
    assert.ok(crop.sw > 0 && crop.sh > 0);
    assert.ok(crop.sx >= 0 && crop.sy >= 0);
    assert.ok(crop.sx + crop.sw <= 1920);
    assert.ok(crop.sy + crop.sh <= 1080);
    const full = viewportRectToVideoCrop(frame, 390, 844, 1920, 1080, "full");
    assert.ok(crop.sh < full.sh, "MRZ crop should be shorter than full frame");
  });

  it("exports MRZ band fraction in valid range", () => {
    assert.ok(MRZ_BAND_FRAC > 0.2 && MRZ_BAND_FRAC < 0.5);
  });
});

describe("mrz-parser", () => {
  it("extracts two MRZ lines from noisy OCR text", () => {
    const lines = extractMrzLines(SAMPLE_OCR);
    assert.ok(lines);
    assert.equal(lines!.length, 2);
    assert.ok(lines![0].length >= 40);
  });

  it("rejects MRZ when check digits fail validation (strict prod gate)", () => {
    // OCR may read lines correctly but fail ICAO checksum — must not emit QR
    assert.equal(parseMrzText(SAMPLE_OCR), null);
  });

  it("returns null for garbage input", () => {
    assert.equal(parseMrzText("hello world"), null);
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
