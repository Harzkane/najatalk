import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_PAYOUT_KOBO,
  canCreatePendingPayout,
  toKobo,
  validatePayoutAmount,
} from "../utils/payoutRules.js";

test("toKobo converts naira to kobo", () => {
  assert.equal(toKobo(500), 50000);
  assert.equal(toKobo("500"), 50000);
  assert.equal(toKobo(500.25), 50025);
});

test("validatePayoutAmount rejects invalid/minimum amounts", () => {
  const invalid = validatePayoutAmount("abc");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.message, "Payout amount must be valid.");

  const belowMin = validatePayoutAmount(499);
  assert.equal(belowMin.ok, false);
  assert.equal(belowMin.message, "Minimum payout is ₦500.");
});

test("validatePayoutAmount accepts valid payout values", () => {
  const valid = validatePayoutAmount(500);
  assert.equal(valid.ok, true);
  assert.equal(valid.amountKobo, MIN_PAYOUT_KOBO);
});

test("canCreatePendingPayout enforces max three pending payouts rule", () => {
  assert.equal(canCreatePendingPayout(0), true);
  assert.equal(canCreatePendingPayout(2), true);
  assert.equal(canCreatePendingPayout(3), false);
  assert.equal(canCreatePendingPayout(10), false);
});
