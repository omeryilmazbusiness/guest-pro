import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { hotelAssistantConfigRepository } from "../assistant-config/repository";
import { ABOUT_HOTEL_MIN_CHARS, computeHotelSetupCompletion } from "./completion";
import { loadHotelSetupContext } from "./load-context";

const HOTEL_ID = 1;

describe("hotel setup about step (integration)", () => {
  let originalAbout = "";

  before(async () => {
    const config = await hotelAssistantConfigRepository.getOrCreate(HOTEL_ID);
    originalAbout = config.aboutHotel;
  });

  after(async () => {
    await hotelAssistantConfigRepository.upsertConfig(HOTEL_ID, { aboutHotel: originalAbout });
  });

  it("does not complete about below the minimum length", async () => {
    await hotelAssistantConfigRepository.upsertConfig(HOTEL_ID, {
      aboutHotel: "x".repeat(ABOUT_HOTEL_MIN_CHARS - 1),
    });
    const ctx = await loadHotelSetupContext(HOTEL_ID);
    const result = computeHotelSetupCompletion(ctx);
    assert.equal(result.completedSteps.includes("about"), false);
  });

  it("completes about after saving enough text", async () => {
    await hotelAssistantConfigRepository.upsertConfig(HOTEL_ID, {
      aboutHotel: "x".repeat(ABOUT_HOTEL_MIN_CHARS),
    });
    const ctx = await loadHotelSetupContext(HOTEL_ID);
    const result = computeHotelSetupCompletion(ctx);
    assert.equal(result.completedSteps.includes("about"), true);
    assert.ok(result.percent >= 25);
  });
});
