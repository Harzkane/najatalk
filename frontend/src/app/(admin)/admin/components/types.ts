export type Report = {
  _id: string;
  threadId: { _id: string; title: string };
  userId: { _id: string; email: string; flair?: string };
  reportedUserId: { _id: string; email: string; flair?: string };
  reason: string;
  createdAt: string;
};

export type BannedUser = {
  _id: string;
  email: string;
  username?: string | null;
  role?: string;
  flair?: string;
  appealReason?: string;
  appealStatus?: string;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  updatedAt?: string;
};

export type BannedUsersSummary = {
  total: number;
  pendingAppeals: number;
  approvedAppeals: number;
  rejectedAppeals: number;
  suspended: number;
};

export type Ad = {
  _id: string;
  userId: { _id: string; email: string; username?: string | null; role?: string } | null;
  brand: string;
  text: string;
  link: string;
  type: string;
  budget: number;
  cpc: number;
  status: string;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt?: string;
};

export type AdsReviewSummary = {
  total: number;
  pending: number;
  active: number;
  paused: number;
  expired: number;
  totalBudget: number;
};

export type Payout = {
  _id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  reference: string | null;
  recipientId: string | null;
  user: {
    _id: string | null;
    email: string;
    username: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdminPayoutDetails = {
  payout: {
    _id: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    reference: string | null;
    recipientId: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
      _id: string;
      email: string;
      username: string | null;
      role: string;
      isBanned: boolean;
      suspendedUntil?: string | null;
    } | null;
  };
  wallet: {
    balance: number;
    availableBalance: number;
    heldBalance: number;
    updatedAt?: string | null;
  };
  payoutLedger: Array<{
    _id: string;
    entryKind: string;
    walletEffect: number;
    amount: number;
    status: string;
    reference: string | null;
    recipientId: string | null;
    counterparty: string | null;
    createdAt: string;
    transactionId?: string | null;
  }>;
  recentPayouts: Array<{
    _id: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    reference: string | null;
    recipientId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type PayoutSummary = {
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  completedAmount: number;
  completedCount: number;
  failedAmount: number;
  failedCount: number;
};

export type RollupBucket = {
  bucket: string;
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  completedAmount: number;
  completedCount: number;
  failedAmount: number;
  failedCount: number;
};

export type WalletMismatch = {
  userId: string;
  user?: {
    _id: string;
    email: string;
    username: string | null;
    role: string;
  } | null;
  expectedEffect: number;
  ledgerEffect: number;
  delta: number;
  transactionCount: number;
  ledgerCount: number;
  severity: "low" | "medium" | "high";
};

export type WalletMismatchSummary = {
  totalUsersChecked: number;
  mismatchedUsers: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
};

export type RollupBucketDetails = {
  bucket: string;
  period: "daily" | "monthly";
  timezone: string;
  summary: {
    totalAmount: number;
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    failedCount: number;
  };
  pagination: AdminPagination;
  rows: Payout[];
};

export type WalletMismatchDetails = {
  user: {
    _id: string;
    email: string;
    username: string | null;
    role: string;
    isBanned: boolean;
    suspendedUntil?: string | null;
  } | null;
  wallet: {
    balance: number;
    availableBalance: number;
    heldBalance: number;
    updatedAt?: string | null;
  };
  summary: {
    expectedEffect: number;
    ledgerEffect: number;
    delta: number;
    transactionCount: number;
    ledgerCount: number;
    severity: "low" | "medium" | "high";
  };
  recentTransactions: Array<{
    _id: string;
    senderId: string;
    receiverId: string;
    type: "escrow" | "payout" | "refund" | "tip";
    status: "pending" | "completed" | "failed";
    amount: number;
    platformCut: number;
    reference: string | null;
    recipientId: string | null;
    createdAt: string;
  }>;
  recentLedger: Array<{
    _id: string;
    entryKind: string;
    amount: number;
    walletEffect: number;
    status: "pending" | "completed" | "failed";
    reference: string | null;
    recipientId: string | null;
    counterparty: string | null;
    transactionId: string | null;
    createdAt: string;
  }>;
};

export type PremiumAuditRow = {
  _id: string;
  reference: string;
  status: "initiated" | "processing" | "completed" | "failed";
  amount: number;
  currency: string;
  verificationSource: "manual" | "webhook" | null;
  verifyAttempts: number;
  failureReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
  user: {
    _id: string;
    email: string;
    username: string | null;
    isPremium: boolean;
    premiumStatus: string;
  } | null;
  hasMismatch: boolean;
  mismatchReasons: string[];
};

export type PremiumAuditDetails = {
  payment: {
    _id: string;
    reference: string;
    status: "initiated" | "processing" | "completed" | "failed";
    amount: number;
    currency: string;
    verificationSource: "manual" | "webhook" | null;
    verifyAttempts: number;
    failureReason: string | null;
    channel: string | null;
    gatewayTransactionId: string | null;
    paidAt: string | null;
    verifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
    gatewayResponse: unknown;
  };
  user: {
    _id: string;
    email: string;
    username: string | null;
    role: string;
    isPremium: boolean;
    premiumStatus: string;
    premiumPlan: string | null;
    premiumStartedAt: string | null;
    premiumExpiresAt: string | null;
    nextBillingAt: string | null;
    cancelAtPeriodEnd: boolean;
    premiumLastPaymentRef: string | null;
  } | null;
  hasMismatch: boolean;
  mismatchReasons: string[];
  recentRows: Array<{
    _id: string;
    reference: string;
    status: "initiated" | "processing" | "completed" | "failed";
    amount: number;
    currency: string;
    verificationSource: "manual" | "webhook" | null;
    verifyAttempts: number;
    failureReason: string | null;
    createdAt: string;
    verifiedAt: string | null;
  }>;
};

export type PremiumAuditSummary = {
  total: number;
  mismatchCount: number;
  completedCount: number;
  failedCount: number;
  processingCount: number;
  initiatedCount: number;
};

export type AdminManagedUser = {
  _id: string;
  email: string;
  username?: string | null;
  role: "user" | "mod" | "admin" | "super_admin";
  isBanned: boolean;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  appealStatus?: string | null;
  flair?: string | null;
  isPremium?: boolean;
  premiumStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserDetails = {
  user: {
    _id: string;
    email: string;
    username?: string | null;
    role: "user" | "mod" | "admin" | "super_admin";
    isVerified: boolean;
    isBanned: boolean;
    suspendedUntil?: string | null;
    suspensionReason?: string | null;
    appealStatus?: string | null;
    flair?: string | null;
    isPremium?: boolean;
    premiumStatus?: string;
    premiumPlan?: string | null;
    premiumStartedAt?: string | null;
    premiumExpiresAt?: string | null;
    nextBillingAt?: string | null;
    cancelAtPeriodEnd?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  stats: {
    threads: number;
    listings: number;
    soldListings: number;
    payouts: number;
    pendingPayouts: number;
    tipsSentKobo: number;
    tipsReceivedKobo: number;
    reportsAgainst: number;
    reportsFiled: number;
  };
  recentActions: Array<{
    _id: string;
    action: string;
    reason: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    actor: { _id: string; email: string; role: string } | null;
  }>;
};

export type AdminUsersSummary = {
  total: number;
  banned: number;
  admins: number;
  mods: number;
  premium: number;
};

export type AdminActionLogRow = {
  _id: string;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: { _id: string; email: string; role: string } | null;
  targetUser: { _id: string; email: string; role: string } | null;
};

export type AdminPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type AdminManagedThread = {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  category?: string;
  isLocked?: boolean;
  isSticky?: boolean;
  isSolved?: boolean;
  userId?: { _id: string; email: string; role?: string; flair?: string } | null;
  replyCount: number;
  reportCount: number;
};

export type AdminThreadsSummary = {
  total: number;
  locked: number;
  sticky: number;
  solved: number;
  reported: number;
};

export type AdminThreadDetails = {
  thread: {
    _id: string;
    title: string;
    body: string;
    category: string;
    createdAt: string;
    isLocked: boolean;
    isSticky: boolean;
    isSolved: boolean;
    lockedAt?: string | null;
    stickyAt?: string | null;
    solvedAt?: string | null;
    likesCount: number;
    bookmarksCount: number;
    author: {
      _id: string;
      email: string;
      username?: string | null;
      role: string;
      flair?: string | null;
    } | null;
    solvedBy: { _id: string; email: string; role: string } | null;
    stickyBy: { _id: string; email: string; role: string } | null;
    lockedBy: { _id: string; email: string; role: string } | null;
  };
  stats: {
    replies: number;
    reports: number;
  };
  recentReplies: Array<{
    _id: string;
    body: string;
    createdAt: string;
    parentReplyId?: string | null;
    author: {
      _id: string;
      email: string;
      flair?: string | null;
      role: string;
    } | null;
  }>;
  recentReports: Array<{
    _id: string;
    reason: string;
    createdAt: string;
    reporter: {
      _id: string;
      email: string;
      flair?: string | null;
      role: string;
    } | null;
    reportedUser: {
      _id: string;
      email: string;
      flair?: string | null;
      role: string;
    } | null;
  }>;
};

export type AdminContest = {
  _id: string;
  title: string;
  description: string;
  rules?: string;
  termsVersion?: string;
  termsUrl?: string;
  policyUrl?: string;
  requireTermsAcceptance?: boolean;
  category: string;
  prize: number;
  status: "draft" | "live" | "closed" | "archived";
  startDate: string;
  endDate: string;
  votingEnabled: boolean;
  maxSubmissionsPerUser: number;
  winnerSubmissionId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { _id: string; email: string } | null;
  stats?: {
    totalSubmissions: number;
    approvedSubmissions: number;
  };
};

export type AdminContestsSummary = {
  total: number;
  draft: number;
  live: number;
  closed: number;
  archived: number;
};

export type AdminContestSubmission = {
  _id: string;
  contestId: string;
  userId?: { _id: string; email: string; username?: string | null } | null;
  threadId?: { _id: string; title: string } | null;
  listingId?: { _id: string; title: string } | null;
  title: string;
  summary: string;
  termsAccepted?: boolean;
  termsVersionAccepted?: string;
  termsAcceptedAt?: string | null;
  contestRulesSnapshot?: string;
  contestTermsUrlSnapshot?: string;
  contestPolicyUrlSnapshot?: string;
  prizeClaim?: {
    status?: "not_requested" | "pending_review" | "approved" | "rejected" | "paid";
    requestedAt?: string | null;
    reviewedAt?: string | null;
    reviewNote?: string;
    fullName?: string;
    phone?: string;
    idType?: string;
    idNumberLast4?: string;
    payoutReference?: string;
    paidAt?: string | null;
  };
  status: "pending" | "approved" | "rejected" | "winner";
  score: number;
  voteCount: number;
  reviewNote?: string;
  reviewedBy?: { _id: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminContestDetails = {
  contest: AdminContest;
  submissions: AdminContestSubmission[];
  pagination: AdminPagination;
};

export type PlatformWalletOverview = {
  wallet: {
    balance: number;
    lastUpdated: string | null;
  };
  summary: {
    totalCredits: number;
    totalCreditsCount: number;
    totalDebits: number;
    totalDebitsCount: number;
    netFlow: number;
  };
  dateRange: {
    dateFrom: string | null;
    dateTo: string | null;
  };
};

export type PlatformWalletSummary = {
  totalCredits: number;
  totalDebits: number;
};

export type PlatformWalletEntry = {
  entryId: string;
  source: "transaction" | "wallet_ledger";
  sourceId: string;
  entryKind: string;
  direction: "credit" | "debit";
  amount: number;
  walletEffect: number;
  status: "pending" | "completed" | "failed";
  reference: string | null;
  createdAt: string;
  updatedAt: string;
  type: string | null;
  listingTitle: string | null;
  contestTitle: string | null;
  contestId: string | null;
  user: {
    _id: string;
    email: string;
    username: string | null;
    role: string;
  } | null;
  metadata: Record<string, unknown>;
};

export type PlatformWalletEntryDetails = {
  entry: PlatformWalletEntry;
  transaction?: Record<string, unknown> | null;
  ledgerEntry?: Record<string, unknown> | null;
  relatedLedger?: Array<{
    _id: string;
    user: {
      _id: string;
      email: string;
      username: string | null;
      role: string;
    } | null;
    entryKind: string;
    amount: number;
    walletEffect: number;
    status: string;
    reference: string | null;
    recipientId: string | null;
    counterparty: string | null;
    listingTitle: string | null;
    createdAt: string;
  }>;
  contest?: {
    _id: string;
    title: string;
    prize: number;
    status: string;
  } | null;
  submission?: {
    _id: string;
    title: string;
    status: string;
    voteCount: number;
    contestId: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UserRiskSignalRow = {
  user: {
    _id: string;
    email: string;
    username: string | null;
    role: string;
    isBanned: boolean;
    suspendedUntil: string | null;
  };
  metrics: {
    failedPayoutCount: number;
    payoutTotalCount: number;
    pendingPayoutCount: number;
    tipReceivedCount: number;
    tipReceivedUniqueSenders: number;
    tipReceivedTotalKobo: number;
  };
  score: number;
  severity: "none" | "low" | "medium" | "high";
  reasons: string[];
};

export type UserRiskSignalSummary = {
  totalFlagged: number;
  high: number;
  medium: number;
  low: number;
  windowDays: number;
  since: string;
};

export type ContestRiskSignalRow = {
  contest: {
    _id: string;
    title: string;
    status: "draft" | "live" | "closed" | "archived";
    startDate: string;
    endDate: string;
    prize: number;
    createdBy: { _id: string; email: string } | null;
  };
  metrics: {
    totalVotes: number;
    uniqueVoters: number;
    topSubmissionVotes: number;
    voteCountMismatchCount: number;
    duplicateVoterEntryCount: number;
    selfVoteCount: number;
    submissions: number;
  };
  score: number;
  severity: "none" | "low" | "medium" | "high";
  reasons: string[];
};

export type ContestRiskSignalSummary = {
  totalFlagged: number;
  high: number;
  medium: number;
  low: number;
};
