import * as assert from "node:assert/strict";
import { calculateBookingPrice } from "../src/bookings/pricing";

const day = "2026-04-21";
const pricing = {
  regularMorningPriceMinor: 40_000,
  regularEveningPriceMinor: 70_000,
  vipMorningPriceMinor: 80_000,
  vipEveningPriceMinor: 100_000
};

function at(time: string) {
  return new Date(`${day}T${time}:00+05:00`);
}

const regularMorning = calculateBookingPrice("REGULAR", at("10:00"), at("11:00"), pricing);
assert.equal(regularMorning.priceMinor, 40_000);
assert.equal(regularMorning.hourlyRateMinor, 40_000);

const vipMorning = calculateBookingPrice("VIP", at("10:00"), at("11:00"), pricing);
assert.equal(vipMorning.priceMinor, 80_000);
assert.equal(vipMorning.hourlyRateMinor, 80_000);

const regularEvening = calculateBookingPrice("REGULAR", at("18:00"), at("20:00"), pricing);
assert.equal(regularEvening.priceMinor, 140_000);

const vipEvening = calculateBookingPrice("VIP", at("18:00"), at("20:00"), pricing);
assert.equal(vipEvening.priceMinor, 200_000);

const mixed = calculateBookingPrice("REGULAR", at("17:00"), at("19:00"), pricing);
assert.equal(mixed.priceMinor, 110_000);
assert.deepEqual(mixed.segments.map((segment) => segment.amountMinor), [40_000, 70_000]);
