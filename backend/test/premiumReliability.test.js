// cd backend
// npm test

import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePremiumPaymentChecks,
  getVerificationStateDecision,
} from "../controllers/premium.js";

test("getVerificationStateDecision enforces strict verifiable state", () => {
  assert.deepEqual(getVerificationStateDecision("initiated"), {
    code: "verifiable",
    httpStatus: 200,
  });
  assert.deepEqual(getVerificationStateDecision("processing"), {
    code: "in_progress",
    httpStatus: 409,
  });
  assert.deepEqual(getVerificationStateDecision("completed"), {
    code: "already_completed",
    httpStatus: 200,
  });
  assert.deepEqual(getVerificationStateDecision("failed"), {
    code: "already_failed",
    httpStatus: 400,
  });
});

test("evaluatePremiumPaymentChecks passes only when all checks match", () => {
  const result = evaluatePremiumPaymentChecks({
    txSummary: {
      status: "success",
      amount: 50000,
      reference: "ref_123",
      customerEmail: "demo@example.com",
      currency: "NGN",
    },
    paymentRecord: {
      amount: 50000,
      reference: "ref_123",
      email: "demo@example.com",
      currency: "NGN",
    },
  });

  assert.equal(result.allPassed, true);
  assert.equal(result.failureReason, null);
});

test("evaluatePremiumPaymentChecks returns precise failure reasons", () => {
  const unexpectedCurrency = evaluatePremiumPaymentChecks({
    txSummary: {
      status: "success",
      amount: 50000,
      reference: "ref_123",
      customerEmail: "demo@example.com",
      currency: "USD",
    },
    paymentRecord: {
      amount: 50000,
      reference: "ref_123",
      email: "demo@example.com",
      currency: "USD",
    },
  });
  assert.equal(unexpectedCurrency.allPassed, false);
  assert.equal(unexpectedCurrency.failureReason, "unexpected_currency");

  const referenceMismatch = evaluatePremiumPaymentChecks({
    txSummary: {
      status: "success",
      amount: 50000,
      reference: "ref_bad",
      customerEmail: "demo@example.com",
      currency: "NGN",
    },
    paymentRecord: {
      amount: 50000,
      reference: "ref_123",
      email: "demo@example.com",
      currency: "NGN",
    },
  });
  assert.equal(referenceMismatch.allPassed, false);
  assert.equal(referenceMismatch.failureReason, "reference_mismatch");
});
