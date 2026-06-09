import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { GuestTranslations } from "./i18n";
import {
  buildConciergeStructuredData,
  buildConciergeSummary,
  parseConciergeBooking,
} from "./guest-concierge";

const t = {
  conciergeLaundry: "Laundry",
  conciergeSpa: "Spa & Wellness",
  conciergeTaxi: "Taxi",
  conciergeSalon: "Salon",
  conciergeWhenAsap: "ASAP",
  conciergeWhenMorning: "This morning",
  conciergeWhenAfternoon: "This afternoon",
  conciergeWhenEvening: "This evening",
  conciergeWhenTomorrow: "Tomorrow",
  conciergeSummary: "{service} · {when}",
} as GuestTranslations;

describe("guest-concierge", () => {
  it("builds structured data for reception routing", () => {
    const data = buildConciergeStructuredData("laundry", "morning", "Pick up at 9");
    assert.equal(data.kind, "concierge_booking");
    assert.equal(data.service, "laundry");
    assert.equal(data.destination, "reception");
  });

  it("builds localized summary", () => {
    const summary = buildConciergeSummary(t, "taxi", "asap", "");
    assert.match(summary, /Taxi/);
    assert.match(summary, /ASAP/);
  });

  it("round-trips parseConciergeBooking", () => {
    const data = buildConciergeStructuredData("spa_wellness", "evening", "Massage");
    const parsed = parseConciergeBooking(data);
    assert.deepEqual(parsed, {
      service: "spa_wellness",
      when: "evening",
      notes: "Massage",
    });
  });
});
