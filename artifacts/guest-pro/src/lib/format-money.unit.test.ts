import { describe, expect, it } from "vitest";
import { formatMoney, parseMoney } from "./format-money";

describe("formatMoney", () => {
  it("formats TRY amounts", () => {
    const out = formatMoney("125.5", "TRY", "tr-TR");
    expect(out).toMatch(/125/);
  });

  it("parseMoney returns 0 for invalid", () => {
    expect(parseMoney("x")).toBe(0);
    expect(parseMoney("42.10")).toBe(42.1);
  });
});
