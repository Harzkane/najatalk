export const computeUserRiskSignal = (metrics = {}) => {
  const failedPayoutCount = Number(metrics.failedPayoutCount || 0);
  const payoutTotalCount = Number(metrics.payoutTotalCount || 0);
  const pendingPayoutCount = Number(metrics.pendingPayoutCount || 0);
  const tipReceivedCount = Number(metrics.tipReceivedCount || 0);
  const tipReceivedUniqueSenders = Number(metrics.tipReceivedUniqueSenders || 0);
  const tipReceivedTotalKobo = Number(metrics.tipReceivedTotalKobo || 0);

  const reasons = [];
  let score = 0;

  if (failedPayoutCount >= 3) {
    score += 3;
    reasons.push("repeated_failed_payouts");
  }

  const failedPayoutRate =
    payoutTotalCount > 0 ? failedPayoutCount / payoutTotalCount : 0;
  if (payoutTotalCount >= 2 && failedPayoutRate >= 0.5) {
    score += 2;
    reasons.push("high_failed_payout_ratio");
  }

  if (pendingPayoutCount >= 2) {
    score += 1;
    reasons.push("multiple_pending_payouts");
  }

  if (tipReceivedCount >= 20) {
    score += 2;
    reasons.push("high_tip_velocity");
  }

  if (tipReceivedCount >= 8 && tipReceivedUniqueSenders <= 2) {
    score += 2;
    reasons.push("tip_sender_concentration");
  }

  if (tipReceivedTotalKobo >= 500000) {
    score += 2;
    reasons.push("high_tip_volume");
  }

  const severity = score >= 5 ? "high" : score >= 3 ? "medium" : score >= 1 ? "low" : "none";
  return { score, severity, reasons };
};

export const computeContestRiskSignal = (metrics = {}) => {
  const totalVotes = Number(metrics.totalVotes || 0);
  const uniqueVoters = Number(metrics.uniqueVoters || 0);
  const topSubmissionVotes = Number(metrics.topSubmissionVotes || 0);
  const voteCountMismatchCount = Number(metrics.voteCountMismatchCount || 0);
  const duplicateVoterEntryCount = Number(metrics.duplicateVoterEntryCount || 0);
  const selfVoteCount = Number(metrics.selfVoteCount || 0);

  const reasons = [];
  let score = 0;

  if (voteCountMismatchCount > 0) {
    score += 3;
    reasons.push("vote_count_mismatch");
  }
  if (duplicateVoterEntryCount > 0) {
    score += 3;
    reasons.push("duplicate_voter_entries");
  }
  if (selfVoteCount > 0) {
    score += 2;
    reasons.push("self_vote_detected");
  }

  const topShare = totalVotes > 0 ? topSubmissionVotes / totalVotes : 0;
  if (totalVotes >= 30 && topShare >= 0.8) {
    score += 2;
    reasons.push("winner_vote_concentration");
  }

  const votesPerUniqueVoter = uniqueVoters > 0 ? totalVotes / uniqueVoters : 0;
  if (totalVotes >= 20 && votesPerUniqueVoter > 2.5) {
    score += 2;
    reasons.push("voter_overlap_pattern");
  }

  const severity = score >= 5 ? "high" : score >= 3 ? "medium" : score >= 1 ? "low" : "none";
  return { score, severity, reasons };
};
