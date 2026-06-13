import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultRememberMeParts,
  formatDayKey,
  rememberMePartsToDate,
  snapRememberMeMinute,
} from "./remember-me-datetime";

describe("remember-me-datetime", () => {
  it("snaps minutes to 5-step grid", () => {
    assert.equal(snapRememberMeMinute(7), 5);
    assert.equal(snapRememberMeMinute(58), 55);
  });

  it("builds a valid local datetime from wheel parts", () => {
    const parts = defaultRememberMeParts();
    const d = rememberMePartsToDate(parts.dayKey, parts.hour24, parts.minute);
    assert.equal(formatDayKey(d), parts.dayKey);
    assert.equal(d.getHours(), parts.hour24);
    assert.equal(d.getMinutes(), parts.minute);
  });
});
