import test from "node:test";
import assert from "node:assert/strict";
import {
  computeContestRiskSignal,
  computeUserRiskSignal,
} from "../utils/riskSignals.js";

test("computeUserRiskSignal returns high severity for repeated payout and tip concentration", () => {
  const signal = computeUserRiskSignal({
    failedPayoutCount: 4,
    payoutTotalCount: 5,
    pendingPayoutCount: 2,
    tipReceivedCount: 12,
    tipReceivedUniqueSenders: 2,
    tipReceivedTotalKobo: 600000,
  });
  assert.equal(signal.severity, "high");
  assert.ok(signal.reasons.includes("repeated_failed_payouts"));
  assert.ok(signal.reasons.includes("tip_sender_concentration"));
});

test("computeUserRiskSignal returns none when metrics are normal", () => {
  const signal = computeUserRiskSignal({
    failedPayoutCount: 0,
    payoutTotalCount: 1,
    pendingPayoutCount: 0,
    tipReceivedCount: 3,
    tipReceivedUniqueSenders: 3,
    tipReceivedTotalKobo: 12000,
  });
  assert.equal(signal.severity, "none");
  assert.equal(signal.score, 0);
});

test("computeContestRiskSignal returns high severity on integrity anomalies", () => {
  const signal = computeContestRiskSignal({
    totalVotes: 60,
    uniqueVoters: 15,
    topSubmissionVotes: 52,
    voteCountMismatchCount: 1,
    duplicateVoterEntryCount: 1,
    selfVoteCount: 1,
  });
  assert.equal(signal.severity, "high");
  assert.ok(signal.reasons.includes("vote_count_mismatch"));
  assert.ok(signal.reasons.includes("duplicate_voter_entries"));
});

test("computeContestRiskSignal returns low/none for healthy contest metrics", () => {
  const signal = computeContestRiskSignal({
    totalVotes: 12,
    uniqueVoters: 10,
    topSubmissionVotes: 5,
    voteCountMismatchCount: 0,
    duplicateVoterEntryCount: 0,
    selfVoteCount: 0,
  });
  assert.equal(signal.severity, "none");
});
