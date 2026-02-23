// backend/controllers/users.js

import mongoose from "mongoose";
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import PlatformWallet from "../models/platformWallet.js";
import WalletLedger from "../models/walletLedger.js";
import axios from "axios";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Listing from "../models/listing.js";
import Thread from "../models/thread.js";
import Report from "../models/report.js";
import AdminActionLog from "../models/adminActionLog.js";
import Contest from "../models/contests.js";
import ContestSubmission from "../models/contestSubmission.js";
import PremiumPayment from "../models/premiumPayment.js";
import { syncPremiumAccessState } from "../utils/premiumAccess.js";
import { ASSIGNABLE_ROLES, hasPermission } from "../utils/permissions.js";
import { canCreatePendingPayout, validatePayoutAmount } from "../utils/payoutRules.js";
import { computeUserRiskSignal } from "../utils/riskSignals.js";
import { sendEmail } from "../utils/email.js";
import { logger } from "../utils/logger.js";

const maskEmail = (email = "") => {
  const [local = "", domain = ""] = email.split("@");
  if (!local || !domain) return "";
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
const sanitizeDeliveryField = (value, maxLength = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};
const normalizeDefaultDeliveryAddress = (input = {}) => ({
  fullName: sanitizeDeliveryField(input.fullName, 80),
  phone: sanitizeDeliveryField(input.phone, 30),
  addressLine1: sanitizeDeliveryField(input.addressLine1, 160),
  addressLine2: sanitizeDeliveryField(input.addressLine2, 160),
  city: sanitizeDeliveryField(input.city, 80),
  state: sanitizeDeliveryField(input.state, 80),
  postalCode: sanitizeDeliveryField(input.postalCode, 20),
  deliveryNote: sanitizeDeliveryField(input.deliveryNote, 280),
});

const toDisplayName = (user) => {
  if (user?.username) return user.username;
  return user?.email?.split("@")?.[0]?.trim()?.slice(0, 24) || "naijatalker";
};

const buildPremiumView = (user) => ({
  isPremium: Boolean(user?.isPremium),
  premiumStatus: user?.premiumStatus || "inactive",
  premiumPlan: user?.premiumPlan || null,
  premiumStartedAt: user?.premiumStartedAt || null,
  premiumExpiresAt: user?.premiumExpiresAt || null,
  nextBillingAt: user?.nextBillingAt || null,
  cancelAtPeriodEnd: Boolean(user?.cancelAtPeriodEnd),
});

const getProfileMissingFields = (user) => {
  const missing = [];
  if (!user?.username) missing.push("username");
  if (!user?.bio?.trim()) missing.push("bio");
  if (!user?.location?.trim()) missing.push("location");
  return missing;
};

const buildProfileCompleteness = (user) => {
  const requiredFields = ["username", "bio", "location"];
  const missingFields = getProfileMissingFields(user);
  const completedCount = requiredFields.length - missingFields.length;
  const percent = Math.round((completedCount / requiredFields.length) * 100);

  return {
    requiredFields,
    missingFields,
    percent,
    isComplete: missingFields.length === 0,
  };
};

const getLagosStartOfDayUTCDate = () => {
  // Africa/Lagos is UTC+1 year-round; this keeps day-boundary checks stable.
  const lagosOffsetMinutes = 60;
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const lagosNow = new Date(utcMs + lagosOffsetMinutes * 60_000);
  lagosNow.setHours(0, 0, 0, 0);
  return new Date(lagosNow.getTime() - lagosOffsetMinutes * 60_000);
};

const toObjectIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return value._id.toString();
  return value.toString();
};

const buildCreatedAtDateRangeFilter = (dateFromRaw = "", dateToRaw = "") => {
  const createdAt = {};
  const dateFrom = String(dateFromRaw || "").trim();
  const dateTo = String(dateToRaw || "").trim();

  if (dateFrom) {
    const parsedFrom = new Date(dateFrom);
    if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
  }

  if (dateTo) {
    const parsedTo = new Date(dateTo);
    if (!Number.isNaN(parsedTo.getTime())) {
      parsedTo.setHours(23, 59, 59, 999);
      createdAt.$lte = parsedTo;
    }
  }

  return Object.keys(createdAt).length > 0 ? createdAt : null;
};

const getDateBucket = (date, period = "daily", timezone = "Africa/Lagos") => {
  const safeDate = new Date(date);
  if (Number.isNaN(safeDate.getTime())) return "invalid";
  const dayFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dayFmt.formatToParts(safeDate);
  const year = parts.find((p) => p.type === "year")?.value || "0000";
  const month = parts.find((p) => p.type === "month")?.value || "00";
  const day = parts.find((p) => p.type === "day")?.value || "00";
  if (period === "monthly") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

const formatPayoutRecipient = (details = {}) => {
  const accountName = String(details.accountName || "").trim();
  const accountNumber = String(details.accountNumber || "").trim();
  const bankName = String(details.bankName || "").trim();
  const channel = String(details.channel || "bank_transfer").trim();
  const maskedAccount =
    accountNumber.length >= 4
      ? `****${accountNumber.slice(-4)}`
      : accountNumber || "****";
  return `${accountName || "Account"} (${maskedAccount}) - ${
    bankName || channel
  }`;
};

const formatNairaFromKobo = (kobo = 0) =>
  `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getWalletSnapshot = (wallet) => {
  const availableBalance = Number(wallet?.availableBalance || 0);
  const heldBalance = Number(wallet?.heldBalance || 0);
  const balance = Number(wallet?.balance || availableBalance + heldBalance);
  return { availableBalance, heldBalance, balance };
};

const createLedgerEntry = async ({
  userId,
  entryKind,
  amount = 0,
  walletEffect = 0,
  status = "completed",
  reference = null,
  counterparty = null,
  recipientId = null,
  listingTitle = null,
  wallet = null,
  metadata = {},
  transactionId = null,
  listingId = null,
  session = null,
}) => {
  const snapshot = getWalletSnapshot(wallet);
  const payload = {
    userId,
    entryKind,
    amount,
    walletEffect,
    status,
    reference,
    counterparty,
    recipientId,
    listingTitle,
    availableBalance: snapshot.availableBalance,
    heldBalance: snapshot.heldBalance,
    balance: snapshot.balance,
    metadata,
    transactionId,
    listingId,
  };
  if (session) {
    await WalletLedger.create([payload], { session });
    return;
  }
  await WalletLedger.create(payload);
};

const ensureWalletBalanceFields = async (userId, options = {}) => {
  const { session = null } = options;
  let query = Wallet.findOne({ userId });
  if (session) query = query.session(session);
  const wallet = await query;
  if (!wallet) return null;

  let changed = false;
  if (typeof wallet.heldBalance !== "number") {
    wallet.heldBalance = 0;
    changed = true;
  }
  if (typeof wallet.availableBalance !== "number") {
    wallet.availableBalance = Math.max(
      0,
      Number(wallet.balance || 0) - Number(wallet.heldBalance || 0)
    );
    changed = true;
  }
  const computedTotal = Number(wallet.availableBalance || 0) + Number(wallet.heldBalance || 0);
  if (Number(wallet.balance || 0) !== computedTotal) {
    wallet.balance = computedTotal;
    changed = true;
  }
  if (changed) {
    if (session) {
      await wallet.save({ session });
    } else {
      await wallet.save();
    }
  }
  return wallet;
};

const buildSellerStats = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  const [listingCounts, completedDealsAgg, responseAgg] = await Promise.all([
    Listing.aggregate([
      {
        $match: {
          userId: objectId,
          status: { $ne: "deleted" },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          receiverId: objectId,
          type: "escrow",
          status: "completed",
        },
      },
      { $group: { _id: "$receiverId", count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          receiverId: objectId,
          type: "escrow",
          status: "completed",
        },
      },
      {
        $project: {
          createdAtDate: {
            $convert: {
              input: "$createdAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
          updatedAtDate: {
            $convert: {
              input: "$updatedAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $project: {
          responseHours: {
            $cond: [
              {
                $and: [
                  { $ne: ["$updatedAtDate", null] },
                  { $ne: ["$createdAtDate", null] },
                ],
              },
              {
                $divide: [
                  { $subtract: ["$updatedAtDate", "$createdAtDate"] },
                  1000 * 60 * 60,
                ],
              },
              null,
            ],
          },
        },
      },
      { $match: { responseHours: { $ne: null } } },
      { $group: { _id: null, avgResponseHours: { $avg: "$responseHours" } } },
    ]),
  ]);

  const listingSummary = {
    total: 0,
    active: 0,
    pending: 0,
    sold: 0,
  };

  for (const row of listingCounts) {
    listingSummary.total += row.count;
    if (row._id === "active") listingSummary.active = row.count;
    if (row._id === "pending") listingSummary.pending = row.count;
    if (row._id === "sold") listingSummary.sold = row.count;
  }

  const completedDeals = completedDealsAgg[0]?.count || 0;
  const avgRaw = responseAgg[0]?.avgResponseHours;
  const avgResponseHours =
    typeof avgRaw === "number" && Number.isFinite(avgRaw)
      ? Number(avgRaw.toFixed(1))
      : null;

  return {
    completedDeals,
    activeListings: listingSummary.active,
    soldListings: listingSummary.sold,
    pendingListings: listingSummary.pending,
    totalListings: listingSummary.total,
    avgResponseHours,
    trustTier:
      completedDeals >= 10
        ? "Top Seller"
        : completedDeals >= 3
        ? "Trusted Seller"
        : "New Seller",
  };
};

const isSuperAdmin = (user) => user?.role === "super_admin";
const canManagePrivilegedRoles = (actor, targetRole) =>
  !["admin", "super_admin"].includes(targetRole) || isSuperAdmin(actor);

const logAdminAction = async ({
  actorId,
  targetUserId = null,
  action,
  reason = null,
  metadata = {},
  session = null,
}) => {
  try {
    if (!actorId || !action) return;
    const payload = {
      actorId,
      targetUserId,
      action,
      reason: reason || null,
      metadata,
    };
    if (session) {
      await AdminActionLog.create([payload], { session });
      return;
    }
    await AdminActionLog.create(payload);
  } catch (err) {
    console.error("Admin action log error:", err.message);
  }
};

const parseDurationHours = (value) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(parsed, 24 * 90);
};

const SLA_ALERT_THRESHOLDS = {
  pendingPayoutCount: Number.parseInt(process.env.SLA_PENDING_PAYOUT_THRESHOLD || "20", 10),
  failedPayoutCount: Number.parseInt(process.env.SLA_FAILED_PAYOUT_THRESHOLD || "10", 10),
  premiumInFlightCount: Number.parseInt(process.env.SLA_PREMIUM_INFLIGHT_THRESHOLD || "20", 10),
  premiumFailedCount: Number.parseInt(process.env.SLA_PREMIUM_FAILED_THRESHOLD || "8", 10),
  mismatchedUsersCount: Number.parseInt(process.env.SLA_MISMATCHED_USERS_THRESHOLD || "6", 10),
  highSeverityMismatchCount: Number.parseInt(
    process.env.SLA_HIGH_SEVERITY_MISMATCH_THRESHOLD || "2",
    10
  ),
  oldestPendingPayoutHours: Number.parseInt(
    process.env.SLA_OLDEST_PENDING_PAYOUT_HOURS_THRESHOLD || "24",
    10
  ),
  oldestPremiumInFlightHours: Number.parseInt(
    process.env.SLA_OLDEST_PREMIUM_INFLIGHT_HOURS_THRESHOLD || "2",
    10
  ),
};

const SLA_ALERT_WINDOW_DAYS = Number.parseInt(process.env.SLA_ALERT_WINDOW_DAYS || "7", 10);
const SLA_ALERT_COOLDOWN_MINUTES = Number.parseInt(
  process.env.SLA_ALERT_COOLDOWN_MINUTES || "60",
  10
);
const slaAlertLastSentAtByKey = new Map();

const getSlaAlertRecipients = () => {
  const raw = process.env.SLA_ALERT_EMAIL_TO || process.env.EMAIL_USER || "";
  return String(raw)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const computeWalletMismatchSummaryForAlerts = async ({ createdAt }) => {
  const [transactions, ledgers] = await Promise.all([
    Transaction.find({
      type: { $in: ["escrow", "tip", "refund", "payout"] },
      status: { $in: ["pending", "completed", "failed"] },
      ...(createdAt ? { createdAt } : {}),
    })
      .select("senderId receiverId type status amount platformCut")
      .lean(),
    WalletLedger.find({
      transactionId: { $ne: null },
      ...(createdAt ? { createdAt } : {}),
    })
      .select("userId walletEffect")
      .lean(),
  ]);

  const addToMap = (map, userId, amount, txCount = 0) => {
    if (!userId) return;
    const key = userId.toString();
    const current = map.get(key) || { expectedEffect: 0, txCount: 0 };
    current.expectedEffect += Number(amount || 0);
    current.txCount += txCount;
    map.set(key, current);
  };

  const expectedByUser = new Map();
  for (const tx of transactions) {
    const senderId = toObjectIdString(tx.senderId);
    const receiverId = toObjectIdString(tx.receiverId);
    const platformCut = Number(tx.platformCut || 0);
    const amount = Number(tx.amount || 0);

    if (tx.type === "escrow") {
      if (senderId) addToMap(expectedByUser, senderId, -amount, 1);
      if (receiverId && tx.status === "completed") {
        addToMap(expectedByUser, receiverId, amount - platformCut, 1);
      }
    } else if (tx.type === "tip") {
      if (receiverId && tx.status === "completed") {
        addToMap(expectedByUser, receiverId, amount - platformCut, 1);
      }
    } else if (tx.type === "refund" && tx.status === "completed") {
      if (receiverId) addToMap(expectedByUser, receiverId, amount, 1);
      if (senderId) addToMap(expectedByUser, senderId, -amount, 1);
    } else if (tx.type === "payout") {
      if (senderId) {
        if (tx.status === "failed") addToMap(expectedByUser, senderId, amount, 1);
        if (tx.status === "pending" || tx.status === "completed") {
          addToMap(expectedByUser, senderId, -amount, 1);
        }
      }
    }
  }

  const ledgerByUser = new Map();
  for (const entry of ledgers) {
    const userKey = toObjectIdString(entry.userId);
    if (!userKey) continue;
    const current = ledgerByUser.get(userKey) || { ledgerEffect: 0, ledgerCount: 0 };
    current.ledgerEffect += Number(entry.walletEffect || 0);
    current.ledgerCount += 1;
    ledgerByUser.set(userKey, current);
  }

  const allUserIds = new Set([...expectedByUser.keys(), ...ledgerByUser.keys()]);
  let mismatchedUsers = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const userId of allUserIds) {
    const expected = expectedByUser.get(userId) || { expectedEffect: 0, txCount: 0 };
    const ledger = ledgerByUser.get(userId) || { ledgerEffect: 0, ledgerCount: 0 };
    const delta = expected.expectedEffect - ledger.ledgerEffect;
    const hasMismatch = delta !== 0 || expected.txCount !== ledger.ledgerCount;
    if (!hasMismatch) continue;

    mismatchedUsers += 1;
    const absDelta = Math.abs(delta);
    if (absDelta >= 10000) highCount += 1;
    else if (absDelta >= 1000) mediumCount += 1;
    else lowCount += 1;
  }

  return {
    totalUsersChecked: allUserIds.size,
    mismatchedUsers,
    highCount,
    mediumCount,
    lowCount,
  };
};

const buildSlaAlertSnapshot = async () => {
  const windowDays = Number.isFinite(SLA_ALERT_WINDOW_DAYS) ? Math.max(SLA_ALERT_WINDOW_DAYS, 1) : 7;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const createdAtWindow = { $gte: since };

  const [
    pendingPayoutCount,
    failedPayoutCount,
    payoutTotalCount,
    oldestPendingPayout,
    premiumInitiatedCount,
    premiumProcessingCount,
    premiumFailedCount,
    premiumTotalCount,
    oldestPremiumInFlight,
    mismatchSummary,
  ] = await Promise.all([
    Transaction.countDocuments({
      type: "payout",
      status: "pending",
    }),
    Transaction.countDocuments({
      type: "payout",
      status: "failed",
      createdAt: createdAtWindow,
    }),
    Transaction.countDocuments({
      type: "payout",
      createdAt: createdAtWindow,
    }),
    Transaction.findOne({ type: "payout", status: "pending" })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean(),
    PremiumPayment.countDocuments({ status: "initiated" }),
    PremiumPayment.countDocuments({ status: "processing" }),
    PremiumPayment.countDocuments({ status: "failed", createdAt: createdAtWindow }),
    PremiumPayment.countDocuments({ createdAt: createdAtWindow }),
    PremiumPayment.findOne({ status: { $in: ["initiated", "processing"] } })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean(),
    computeWalletMismatchSummaryForAlerts({ createdAt: createdAtWindow }),
  ]);

  const premiumInFlightCount = premiumInitiatedCount + premiumProcessingCount;
  const payoutFailureRatePct =
    payoutTotalCount > 0 ? Number(((failedPayoutCount / payoutTotalCount) * 100).toFixed(1)) : 0;
  const premiumFailureRatePct =
    premiumTotalCount > 0 ? Number(((premiumFailedCount / premiumTotalCount) * 100).toFixed(1)) : 0;
  const oldestPendingPayoutHours = oldestPendingPayout?.createdAt
    ? Number(((Date.now() - new Date(oldestPendingPayout.createdAt).getTime()) / 3600000).toFixed(1))
    : 0;
  const oldestPremiumInFlightHours = oldestPremiumInFlight?.createdAt
    ? Number(((Date.now() - new Date(oldestPremiumInFlight.createdAt).getTime()) / 3600000).toFixed(1))
    : 0;

  return {
    windowDays,
    metrics: {
      pendingPayoutCount,
      failedPayoutCount,
      premiumInFlightCount,
      premiumFailedCount,
      payoutFailureRatePct,
      premiumFailureRatePct,
      oldestPendingPayoutHours,
      oldestPremiumInFlightHours,
      mismatchedUsersCount: mismatchSummary.mismatchedUsers,
      highSeverityMismatchCount: mismatchSummary.highCount,
    },
    mismatchSummary,
  };
};

const evaluateSlaAlerts = (metrics) => {
  const findings = [];
  if (metrics.pendingPayoutCount >= SLA_ALERT_THRESHOLDS.pendingPayoutCount) {
    findings.push({
      key: "pending_payout_queue",
      section: "payouts",
      label: "Pending payout queue above threshold",
      value: `${metrics.pendingPayoutCount} pending`,
    });
  }
  if (metrics.failedPayoutCount >= SLA_ALERT_THRESHOLDS.failedPayoutCount) {
    findings.push({
      key: "failed_payout_count",
      section: "payouts",
      label: "Payout failures above threshold",
      value: `${metrics.failedPayoutCount} failed`,
    });
  }
  if (metrics.premiumInFlightCount >= SLA_ALERT_THRESHOLDS.premiumInFlightCount) {
    findings.push({
      key: "premium_inflight_queue",
      section: "premium",
      label: "Premium in-flight queue above threshold",
      value: `${metrics.premiumInFlightCount} in flight`,
    });
  }
  if (metrics.premiumFailedCount >= SLA_ALERT_THRESHOLDS.premiumFailedCount) {
    findings.push({
      key: "premium_failed_count",
      section: "premium",
      label: "Premium failures above threshold",
      value: `${metrics.premiumFailedCount} failed`,
    });
  }
  if (metrics.mismatchedUsersCount >= SLA_ALERT_THRESHOLDS.mismatchedUsersCount) {
    findings.push({
      key: "wallet_mismatch_queue",
      section: "mismatches",
      label: "Wallet mismatches above threshold",
      value: `${metrics.mismatchedUsersCount} mismatched users`,
    });
  }
  if (metrics.highSeverityMismatchCount >= SLA_ALERT_THRESHOLDS.highSeverityMismatchCount) {
    findings.push({
      key: "wallet_mismatch_high_severity",
      section: "mismatches",
      label: "High-severity wallet mismatches detected",
      value: `${metrics.highSeverityMismatchCount} high severity`,
    });
  }
  if (metrics.oldestPendingPayoutHours >= SLA_ALERT_THRESHOLDS.oldestPendingPayoutHours) {
    findings.push({
      key: "oldest_pending_payout_age",
      section: "payouts",
      label: "Oldest pending payout is aging out",
      value: `${metrics.oldestPendingPayoutHours}h old`,
    });
  }
  if (metrics.oldestPremiumInFlightHours >= SLA_ALERT_THRESHOLDS.oldestPremiumInFlightHours) {
    findings.push({
      key: "oldest_premium_inflight_age",
      section: "premium",
      label: "Oldest premium verification is aging",
      value: `${metrics.oldestPremiumInFlightHours}h old`,
    });
  }
  return findings;
};

const filterSlaAlertCooldown = (findings = []) => {
  const cooldownMs = Math.max(SLA_ALERT_COOLDOWN_MINUTES, 5) * 60 * 1000;
  const now = Date.now();
  const sendNow = [];
  const suppressed = [];

  for (const finding of findings) {
    const lastSentAt = Number(slaAlertLastSentAtByKey.get(finding.key) || 0);
    if (!lastSentAt || now - lastSentAt >= cooldownMs) {
      sendNow.push(finding);
      continue;
    }
    suppressed.push({
      ...finding,
      nextAllowedAt: new Date(lastSentAt + cooldownMs).toISOString(),
    });
  }

  return { sendNow, suppressed };
};

export const banUser = async (req, res) => {
  const { userId } = req.params;
  const reason = String(req.body?.reason || "").trim();
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findByIdAndUpdate(userId, { isBanned: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User no dey!" });
    await logAdminAction({
      actorId: req.user._id,
      targetUserId: user._id,
      action: "user.ban",
      reason: reason || null,
      metadata: { targetEmail: user.email },
    });
    res.json({ message: "User don dey banned—e don finish!" });
  } catch (err) {
    res.status(500).json({ message: "Ban scatter: " + err.message });
  }
};

export const getBannedUsers = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }

    const q = String(req.query.q || "").trim();
    const appealStatus = String(req.query.appealStatus || "all").trim().toLowerCase();
    const suspendedOnly = String(req.query.suspendedOnly || "false") === "true";
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;
    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();

    const query = { isBanned: true };
    if (q) {
      query.$or = [
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ];
    }
    if (appealStatus !== "all") {
      if (appealStatus === "none") query.appealStatus = { $in: [null, ""] };
      if (["pending", "approved", "rejected"].includes(appealStatus)) {
        query.appealStatus = appealStatus;
      }
    }
    if (suspendedOnly) {
      query.suspendedUntil = { $gt: new Date() };
    }
    const updatedAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) updatedAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        updatedAt.$lte = parsedTo;
      }
    }
    if (Object.keys(updatedAt).length > 0) query.updatedAt = updatedAt;

    const [rows, total, summaryAgg] = await Promise.all([
      User.find(query)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .select(
          "_id email username role flair appealReason appealStatus suspendedUntil suspensionReason updatedAt"
        )
        .lean(),
      User.countDocuments(query),
      User.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            pendingAppeals: {
              $sum: { $cond: [{ $eq: ["$appealStatus", "pending"] }, 1, 0] },
            },
            approvedAppeals: {
              $sum: { $cond: [{ $eq: ["$appealStatus", "approved"] }, 1, 0] },
            },
            rejectedAppeals: {
              $sum: { $cond: [{ $eq: ["$appealStatus", "rejected"] }, 1, 0] },
            },
            suspended: {
              $sum: {
                $cond: [{ $gt: ["$suspendedUntil", new Date()] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const stats = summaryAgg[0] || {
      pendingAppeals: 0,
      approvedAppeals: 0,
      rejectedAppeals: 0,
      suspended: 0,
    };

    res.json({
      bannedUsers: rows,
      summary: {
        total,
        pendingAppeals: Number(stats.pendingAppeals || 0),
        approvedAppeals: Number(stats.approvedAppeals || 0),
        rejectedAppeals: Number(stats.rejectedAppeals || 0),
        suspended: Number(stats.suspended || 0),
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + rows.length < total,
        hasPrev: page > 1,
      },
      message: "Banned users dey here—check am!",
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const appealBan = async (req, res) => {
  const { email, password, reason } = req.body;
  try {
    if (!email || !password || !reason)
      return res
        .status(400)
        .json({ message: "Email, password, or reason no dey!" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password no match—try again!" });

    if (!user.isBanned)
      return res
        .status(400)
        .json({ message: "You no dey banned—why you dey appeal?" });
    if (user.appealStatus === "pending")
      return res
        .status(400)
        .json({ message: "Your appeal dey pending—abeg wait!" });
    if (user.appealStatus === "approved")
      return res.status(400).json({ message: "You don dey unbanned—enjoy!" });

    await User.findByIdAndUpdate(
      user._id,
      { appealReason: reason, appealStatus: "pending" },
      { new: true }
    );
    res.json({ message: "Appeal sent—mods go check am!" });
  } catch (err) {
    res.status(500).json({ message: "Appeal scatter: " + err.message });
  }
};

export const unbanUser = async (req, res) => {
  const { userId } = req.params;
  const { approve } = req.body;
  const reason = String(req.body?.reason || "").trim();
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User no dey!" });
    if (!user.isBanned)
      return res
        .status(400)
        .json({ message: "User no dey banned—no need to unban!" });

    const update = approve
      ? {
          isBanned: false,
          appealStatus: "approved",
          appealReason: null,
          suspendedUntil: null,
          suspensionReason: null,
          suspendedBy: null,
        }
      : { appealStatus: "rejected" };
    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
    await logAdminAction({
      actorId: req.user._id,
      targetUserId: updatedUser?._id || userId,
      action: approve ? "user.unban" : "user.appeal_reject",
      reason: reason || null,
      metadata: { targetEmail: updatedUser?.email || user.email },
    });
    res.json({
      message: approve
        ? "User don dey unbanned—welcome back!"
        : "Appeal rejected—stay banned!",
    });
  } catch (err) {
    res.status(500).json({ message: "Unban scatter: " + err.message });
  }
};

export const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const requestedRole = String(req.body?.role || "").trim();
  const reason = String(req.body?.reason || "").trim();

  try {
    if (!hasPermission(req.user, "users.role.manage")) {
      return res.status(403).json({ message: "You no get permission for role management." });
    }
    if (!ASSIGNABLE_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${ASSIGNABLE_ROLES.join(", ")}`,
      });
    }

    const target = await User.findById(userId).select("_id email role");
    if (!target) return res.status(404).json({ message: "User no dey!" });
    if (!canManagePrivilegedRoles(req.user, requestedRole)) {
      return res.status(403).json({
        message: "Only super_admin fit assign admin or super_admin role.",
      });
    }
    if (["admin", "super_admin"].includes(target.role) && !isSuperAdmin(req.user)) {
      return res.status(403).json({
        message: "Only super_admin fit change admin or super_admin users.",
      });
    }

    if (target.role === requestedRole) {
      return res.json({
        message: "Role already set.",
        user: { _id: target._id, email: target.email, role: target.role },
      });
    }

    if (target.role === "super_admin" && requestedRole !== "super_admin") {
      const superAdminCount = await User.countDocuments({ role: "super_admin" });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot remove the last super_admin.",
        });
      }
    }

    const previousRole = target.role;
    target.role = requestedRole;
    await target.save();
    await logAdminAction({
      actorId: req.user._id,
      targetUserId: target._id,
      action: "user.role_update",
      reason: reason || null,
      metadata: { previousRole, nextRole: requestedRole, targetEmail: target.email },
    });

    return res.json({
      message: `Role updated to ${requestedRole}.`,
      user: { _id: target._id, email: target.email, role: target.role },
    });
  } catch (err) {
    return res.status(500).json({ message: "Role update scatter: " + err.message });
  }
};

export const listUsersForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "all").trim();
    const bannedOnly = req.query.bannedOnly === "true";
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;

    const query = {};
    if (q) {
      query.$or = [
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ];
    }
    if (role !== "all") query.role = role;
    if (bannedOnly) query.isBanned = true;

    const [users, total, summaryAgg] = await Promise.all([
      User.find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .select(
          "_id email username role isBanned suspendedUntil suspensionReason appealStatus flair isPremium premiumStatus createdAt updatedAt"
        ),
      User.countDocuments(query),
      User.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            banned: {
              $sum: { $cond: [{ $eq: ["$isBanned", true] }, 1, 0] },
            },
            admins: {
              $sum: {
                $cond: [
                  { $in: ["$role", ["admin", "super_admin"]] },
                  1,
                  0,
                ],
              },
            },
            mods: {
              $sum: { $cond: [{ $eq: ["$role", "mod"] }, 1, 0] },
            },
            premium: {
              $sum: { $cond: [{ $eq: ["$isPremium", true] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = summaryAgg[0] || { banned: 0, admins: 0, mods: 0, premium: 0 };
    const summary = {
      total,
      banned: Number(stats.banned || 0),
      admins: Number(stats.admins || 0),
      mods: Number(stats.mods || 0),
      premium: Number(stats.premium || 0),
    };

    return res.json({
      users,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + users.length < total,
        hasPrev: page > 1,
      },
      message: "Admin users list loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Users list scatter: " + err.message });
  }
};

export const listAdminActions = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const q = String(req.query.q || "").trim();
    const action = String(req.query.action || "all").trim();
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;
    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();

    const query = {};
    if (action !== "all") query.action = action;
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }
    if (Object.keys(createdAt).length > 0) query.createdAt = createdAt;

    if (q) {
      const userMatches = await User.find(
        { email: { $regex: q, $options: "i" } },
        { _id: 1 }
      )
        .limit(500)
        .lean();
      const userIds = userMatches.map((user) => user._id);
      query.$or = [
        { action: { $regex: q, $options: "i" } },
        { reason: { $regex: q, $options: "i" } },
      ];
      if (userIds.length > 0) {
        query.$or.push({ actorId: { $in: userIds } });
        query.$or.push({ targetUserId: { $in: userIds } });
      }
    }

    const [rows, total] = await Promise.all([
      AdminActionLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("actorId", "_id email role")
        .populate("targetUserId", "_id email role")
        .lean(),
      AdminActionLog.countDocuments(query),
    ]);

    return res.json({
      actions: rows.map((row) => ({
        _id: row._id,
        action: row.action,
        reason: row.reason || null,
        metadata: row.metadata || {},
        createdAt: row.createdAt,
        actor: row.actorId
          ? {
              _id: row.actorId._id,
              email: row.actorId.email,
              role: row.actorId.role,
            }
          : null,
        targetUser: row.targetUserId
          ? {
              _id: row.targetUserId._id,
              email: row.targetUserId.email,
              role: row.targetUserId.role,
            }
          : null,
      })),
      summary: {
        total,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + rows.length < total,
        hasPrev: page > 1,
      },
      message: "Admin action logs loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Admin actions scatter: " + err.message });
  }
};

export const getAdminUserDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await User.findById(userId).select(
      "_id email username role isVerified isBanned suspendedUntil suspensionReason appealStatus flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd createdAt updatedAt"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const [threadCount, listingCount, soldListingCount, payoutCount, payoutPendingCount, totalTipsSent, totalTipsReceived, receivedReportsCount, reportedByUserCount, recentActions] =
      await Promise.all([
        Thread.countDocuments({ userId }),
        Listing.countDocuments({ userId, status: { $ne: "deleted" } }),
        Listing.countDocuments({ userId, status: "sold" }),
        Transaction.countDocuments({ senderId: userId, type: "payout" }),
        Transaction.countDocuments({ senderId: userId, type: "payout", status: "pending" }),
        Transaction.aggregate([
          { $match: { senderId: new mongoose.Types.ObjectId(userId), type: "tip", status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { receiverId: new mongoose.Types.ObjectId(userId), type: "tip", status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Report.countDocuments({ reportedUserId: userId }),
        Report.countDocuments({ userId }),
        AdminActionLog.find({ targetUserId: userId })
          .sort({ createdAt: -1 })
          .limit(12)
          .populate("actorId", "email role")
          .lean(),
      ]);

    return res.json({
      user,
      stats: {
        threads: threadCount,
        listings: listingCount,
        soldListings: soldListingCount,
        payouts: payoutCount,
        pendingPayouts: payoutPendingCount,
        tipsSentKobo: Number(totalTipsSent[0]?.total || 0),
        tipsReceivedKobo: Number(totalTipsReceived[0]?.total || 0),
        reportsAgainst: receivedReportsCount,
        reportsFiled: reportedByUserCount,
      },
      recentActions: recentActions.map((row) => ({
        _id: row._id,
        action: row.action,
        reason: row.reason || null,
        metadata: row.metadata || {},
        createdAt: row.createdAt,
        actor: row.actorId
          ? {
              _id: row.actorId._id,
              email: row.actorId.email,
              role: row.actorId.role,
            }
          : null,
      })),
      message: "Admin user details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "User details scatter: " + err.message });
  }
};

export const suspendUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const durationHours = parseDurationHours(req.body?.durationHours);
  const reason = String(req.body?.reason || "").trim();

  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }
    if (!durationHours) {
      return res.status(400).json({ message: "durationHours must be between 1 and 2160." });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "You no fit suspend yourself." });
    }

    const target = await User.findById(userId).select("_id email role suspendedUntil");
    if (!target) return res.status(404).json({ message: "User no dey!" });
    if ((target.role === "admin" || target.role === "super_admin") && !isSuperAdmin(req.user)) {
      return res.status(403).json({ message: "Only super_admin fit suspend admin accounts." });
    }

    const suspendedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    target.suspendedUntil = suspendedUntil;
    target.suspensionReason = reason || null;
    target.suspendedBy = req.user._id;
    await target.save();

    await logAdminAction({
      actorId: req.user._id,
      targetUserId: target._id,
      action: "user.suspend",
      reason: reason || null,
      metadata: { durationHours, suspendedUntil, targetEmail: target.email },
    });

    return res.json({
      message: `User suspended for ${durationHours} hour(s).`,
      suspension: {
        suspendedUntil,
        reason: reason || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Suspend scatter: " + err.message });
  }
};

export const unsuspendUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const reason = String(req.body?.reason || "").trim();
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const target = await User.findById(userId).select("_id email role suspendedUntil");
    if (!target) return res.status(404).json({ message: "User no dey!" });
    if ((target.role === "admin" || target.role === "super_admin") && !isSuperAdmin(req.user)) {
      return res.status(403).json({ message: "Only super_admin fit unsuspend admin accounts." });
    }

    target.suspendedUntil = null;
    target.suspensionReason = null;
    target.suspendedBy = null;
    await target.save();

    await logAdminAction({
      actorId: req.user._id,
      targetUserId: target._id,
      action: "user.unsuspend",
      reason: reason || null,
      metadata: { targetEmail: target.email },
    });

    return res.json({ message: "User suspension removed." });
  } catch (err) {
    return res.status(500).json({ message: "Unsuspend scatter: " + err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id email flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd role username avatarUrl bio location defaultDeliveryAddress profileCompleted"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    const { changed } = syncPremiumAccessState(user);
    if (changed) await user.save();
    const threadCount = await Thread.countDocuments({ userId: req.user._id });
    const completeness = buildProfileCompleteness(user);
    res.json({
      ...user.toObject(),
      defaultDeliveryAddress: normalizeDefaultDeliveryAddress(
        user.defaultDeliveryAddress || {}
      ),
      ...buildPremiumView(user),
      displayName: toDisplayName(user),
      profileCompleteness: completeness.percent,
      missingProfileFields: completeness.missingFields,
      threadCount,
      message: "You dey here—welcome!",
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const getProfileCompleteness = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id email username avatarUrl bio location defaultDeliveryAddress profileCompleted flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd role"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const premiumState = syncPremiumAccessState(user);
    const completeness = buildProfileCompleteness(user);
    const profileCompleted = completeness.isComplete;

    if (user.profileCompleted !== profileCompleted || premiumState.changed) {
      user.profileCompleted = profileCompleted;
      await user.save();
    }

    res.json({
      profileCompleted,
      profileCompleteness: completeness.percent,
      missingFields: completeness.missingFields,
      user: {
        _id: user._id,
        displayName: toDisplayName(user),
        email: user.email,
        username: user.username || null,
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || "",
        location: user.location || "",
        defaultDeliveryAddress: normalizeDefaultDeliveryAddress(
          user.defaultDeliveryAddress || {}
        ),
        flair: user.flair || null,
        ...buildPremiumView(user),
        role: user.role,
      },
      message: profileCompleted
        ? "Profile complete."
        : "Complete your profile to continue.",
    });
  } catch (err) {
    res.status(500).json({ message: "Profile completeness scatter: " + err.message });
  }
};

export const updateMyProfile = async (req, res) => {
  const { username, avatarUrl, bio, location, defaultDeliveryAddress } = req.body;
  try {
    const user = await User.findById(req.user._id).select(
      "_id email username avatarUrl bio location defaultDeliveryAddress profileCompleted flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd role"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    syncPremiumAccessState(user);

    if (typeof username === "string") {
      const normalizedUsername = username.trim().toLowerCase();
      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        return res.status(400).json({
          message:
            "Username must be 3-24 chars and only contain lowercase letters, numbers, underscore.",
        });
      }

      const existing = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: req.user._id },
      }).select("_id");
      if (existing) {
        return res.status(400).json({ message: "Username already taken." });
      }
      user.username = normalizedUsername;
    }

    if (typeof bio === "string") {
      user.bio = bio.trim().slice(0, 280);
    }

    if (typeof location === "string") {
      user.location = location.trim().slice(0, 80);
    }

    if (typeof avatarUrl === "string") {
      const trimmedAvatar = avatarUrl.trim();
      if (trimmedAvatar.length === 0) {
        user.avatarUrl = null;
      } else {
        try {
          const parsed = new URL(trimmedAvatar);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return res.status(400).json({ message: "Avatar URL must be http/https." });
          }
          user.avatarUrl = parsed.toString();
        } catch {
          return res.status(400).json({ message: "Invalid avatar URL." });
        }
      }
    }
    if (defaultDeliveryAddress && typeof defaultDeliveryAddress === "object") {
      user.defaultDeliveryAddress = normalizeDefaultDeliveryAddress(defaultDeliveryAddress);
    }

    const completeness = buildProfileCompleteness(user);
    user.profileCompleted = completeness.isComplete;
    await user.save();

    res.json({
      profileCompleted: user.profileCompleted,
      profileCompleteness: completeness.percent,
      missingFields: completeness.missingFields,
      user: {
        _id: user._id,
        displayName: toDisplayName(user),
        email: user.email,
        username: user.username || null,
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || "",
        location: user.location || "",
        defaultDeliveryAddress: normalizeDefaultDeliveryAddress(
          user.defaultDeliveryAddress || {}
        ),
        flair: user.flair || null,
        ...buildPremiumView(user),
        role: user.role,
      },
      message: user.profileCompleted
        ? "Profile updated—looking sharp!"
        : "Profile saved. Complete all required fields.",
    });
  } catch (err) {
    res.status(500).json({ message: "Profile update scatter: " + err.message });
  }
};

export const updateUserFlair = async (req, res) => {
  const { flair } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User no dey!" });
    syncPremiumAccessState(user);
    const requestedFlair = flair || null;

    const threadCount = await Thread.countDocuments({ userId: req.user._id });
    const availableFlairs = ["Verified G", "Oga at the Top"];

    // Auto-assign "Verified G" if 10+ threads and no premium
    if (threadCount >= 10 && !user.isPremium && !user.flair) {
      user.flair = "Verified G";
    }

    // Premium users can pick flair
    if (user.isPremium && requestedFlair) {
      if (!availableFlairs.includes(requestedFlair)) {
        return res
          .status(400)
          .json({ message: "Flair no valid—pick correct one!" });
      }
      if (user.flair === requestedFlair) {
        return res.json({ message: "You already dey use this flair.", flair: user.flair });
      }
      user.flair = requestedFlair;
    } else if (!user.isPremium && requestedFlair) {
      return res.status(403).json({ message: "Premium only—abeg subscribe!" });
    }

    await user.save();
    res.json({ message: "Flair updated—shine on!", flair: user.flair });
  } catch (err) {
    res.status(500).json({ message: "Flair scatter: " + err.message });
  }
};

export const getUserProfilePublic = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid user ID—check am well!" });
    }

    const user = await User.findById(userId).select(
      "email flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd username avatarUrl bio location"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    const { changed } = syncPremiumAccessState(user);
    if (changed) await user.save();

    const listings = await Listing.find({ userId, status: { $ne: "deleted" } })
      .select("title description price category status imageUrls createdAt updatedAt userId")
      .sort({ updatedAt: -1 });

    const sellerStats = await buildSellerStats(userId);

    const displayName = toDisplayName(user);

    res.json({
      user: {
        _id: user._id,
        displayName,
        maskedEmail: maskEmail(user.email),
        username: user.username || null,
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || "",
        location: user.location || "",
        flair: user.flair,
        isPremium: Boolean(user.isPremium),
        premiumStatus: user.premiumStatus || "inactive",
        premiumPlan: user.premiumPlan || null,
        premiumExpiresAt: user.premiumExpiresAt || null,
      },
      sellerStats,
      listings,
      message: "User profile dey here—check am!",
    });
  } catch (err) {
    res.status(500).json({ message: "Profile fetch scatter: " + err.message });
  }
};

export const getSellerWallet = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid user ID—check am well!" });
    }
    if (req.user._id.toString() !== userId && !hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "No be your wallet—abeg comot!" });
    }

    const wallet = await ensureWalletBalanceFields(userId);
    if (!wallet) {
      return res
        .status(200)
        .json({ balance: 0, message: "Wallet empty—start dey sell!" });
    }

    const transactions = await Transaction.find({
      receiverId: userId,
      status: "completed",
      type: "escrow",
    })
      .populate("listingId", "title")
      .select("amount platformCut createdAt updatedAt listingId");

    res.json({
      balance: wallet.balance,
      availableBalance: wallet.availableBalance || wallet.balance || 0,
      heldBalance: wallet.heldBalance || 0,
      transactions: transactions.map((t) => ({
        amount: Math.max(0, t.amount - (t.platformCut || 0)),
        listingTitle: t.listingId?.title || "Unknown Listing",
        date: t.updatedAt || t.createdAt,
      })),
      message: "Seller wallet dey here—check am!",
    });
  } catch (err) {
    console.error("Seller Wallet Error:", err);
    res.status(500).json({ message: "Wallet fetch scatter: " + err.message });
  }
};

export const getMyWalletLedger = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const includePending = req.query.includePending !== "false";
    const parsedLimit = Number.parseInt(String(req.query.limit || "50"), 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 200)
      : 50;
    const ledgerStatusFilter = includePending
      ? ["pending", "completed", "failed"]
      : ["completed"];

    const [wallet, ledgerEntries, transactions] = await Promise.all([
      ensureWalletBalanceFields(req.user._id),
      WalletLedger.find({
        userId: req.user._id,
        status: { $in: ledgerStatusFilter },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select(
          "entryKind walletEffect amount status reference recipientId counterparty listingTitle createdAt"
        )
        .lean(),
      Transaction.find({
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        ...(includePending
          ? { status: { $in: ["pending", "completed", "failed"] } }
          : { status: "completed" }),
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("senderId", "email username")
        .populate("receiverId", "email username")
        .populate("listingId", "title")
        .select(
          "senderId receiverId amount type status platformCut reference recipientId listingId createdAt updatedAt"
        )
        .lean(),
    ]);

    const safeCounterpartyName = (userDoc) => {
      if (!userDoc) return "unknown";
      if (userDoc.username) return userDoc.username;
      const email = String(userDoc.email || "");
      const [local = "", domain = ""] = email.split("@");
      if (!local || !domain) return "unknown";
      if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
      return `${local.slice(0, 2)}***@${domain}`;
    };

    const transactionEntries = transactions
      .map((tx) => {
        const senderId = toObjectIdString(tx.senderId);
        const receiverId = toObjectIdString(tx.receiverId);
        const isSender = senderId === userId;
        const isReceiver = receiverId === userId;
        const platformCut = tx.platformCut || 0;

        let walletEffect = 0;
        let entryKind = tx.type;

        if (tx.type === "escrow") {
          if (isSender) {
            walletEffect = -tx.amount;
            entryKind = tx.status === "pending" ? "escrow_hold" : "escrow_payment";
          } else if (isReceiver && tx.status === "completed") {
            walletEffect = tx.amount - platformCut;
            entryKind = "escrow_sale_credit";
          }
        } else if (tx.type === "tip") {
          if (isReceiver && tx.status === "completed") {
            walletEffect = tx.amount - platformCut;
            entryKind = "tip_received";
          } else {
            // Sender-side tip is an external payment rail, not internal wallet debit.
            walletEffect = 0;
            entryKind = "tip_external";
          }
        } else if (tx.type === "refund" && tx.status === "completed") {
          walletEffect = isReceiver ? tx.amount : isSender ? -tx.amount : 0;
          entryKind = "refund";
        } else if (tx.type === "payout") {
          if (isSender) {
            if (tx.status === "failed") {
              walletEffect = tx.amount;
              entryKind = "payout_reversed";
            } else if (tx.status === "pending") {
              walletEffect = -tx.amount;
              entryKind = "payout_pending";
            } else if (tx.status === "completed") {
              walletEffect = -tx.amount;
              entryKind = "payout_completed";
            }
          } else if (isReceiver && tx.status === "completed") {
            walletEffect = tx.amount;
            entryKind = "payout_received";
          }
        }

        const counterparty = isSender ? tx.receiverId : tx.senderId;

        return {
          _id: tx._id,
          reference: tx.reference || null,
          recipientId: tx.recipientId || null,
          type: tx.type,
          status: tx.status,
          entryKind,
          walletEffect,
          amount: tx.amount,
          platformCut,
          listingTitle: tx.listingId?.title || null,
          counterparty: safeCounterpartyName(counterparty),
          date: tx.updatedAt || tx.createdAt,
        };
      })
      .filter(
        (entry) =>
          entry.walletEffect !== 0 ||
          (entry.entryKind === "tip_external" && entry.status === "completed")
      );

    const ledgerMappedEntries = ledgerEntries.map((entry) => ({
      _id: entry._id,
      reference: entry.reference || null,
      recipientId: entry.recipientId || null,
      type: entry.entryKind || "ledger",
      status: entry.status || "completed",
      entryKind: entry.entryKind || "ledger",
      walletEffect: Number(entry.walletEffect || 0),
      amount: Number(entry.amount || 0),
      platformCut: 0,
      listingTitle: entry.listingTitle || null,
      counterparty: entry.counterparty || "unknown",
      date: entry.createdAt,
    }));

    const entries =
      ledgerMappedEntries.length > 0 ? ledgerMappedEntries : transactionEntries;

    const summary = entries.reduce(
      (acc, entry) => {
        if (entry.walletEffect > 0) acc.totalCredits += entry.walletEffect;
        if (entry.walletEffect < 0) acc.totalDebits += Math.abs(entry.walletEffect);
        return acc;
      },
      { totalCredits: 0, totalDebits: 0 }
    );

    const pendingEscrowOut = transactions
      .filter(
        (tx) =>
          tx.type === "escrow" &&
          tx.status === "pending" &&
          toObjectIdString(tx.senderId) === userId
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      balance: wallet?.balance || 0,
      availableBalance: wallet?.availableBalance || wallet?.balance || 0,
      heldBalance: wallet?.heldBalance || 0,
      lastUpdated: wallet?.updatedAt || null,
      summary: {
        ...summary,
        pendingEscrowOut,
      },
      entries,
      message: "Wallet ledger loaded.",
    });
  } catch (err) {
    res.status(500).json({ message: "Wallet ledger scatter: " + err.message });
  }
};

export const downloadMyWalletStatementPdf = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const statusRaw = String(req.query.status || "all").toLowerCase();
    const statusFilter =
      statusRaw === "all" ? ["pending", "completed", "failed"] : [statusRaw];
    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }

    const wallet = await ensureWalletBalanceFields(req.user._id);
    const entries = await WalletLedger.find({
      userId: req.user._id,
      status: { $in: statusFilter },
      ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(1000)
      .select(
        "entryKind walletEffect amount status reference counterparty recipientId listingTitle createdAt"
      )
      .lean();

    const generatedAt = new Date();
    const statementId = `stmt_${generatedAt.getTime()}_${userId.slice(-6)}`;
    const signaturePayload = JSON.stringify({
      statementId,
      userId,
      generatedAt: generatedAt.toISOString(),
      filters: {
        status: statusRaw,
        dateFrom: dateFromRaw || null,
        dateTo: dateToRaw || null,
      },
      wallet: {
        balance: wallet?.balance || 0,
        availableBalance: wallet?.availableBalance || wallet?.balance || 0,
        heldBalance: wallet?.heldBalance || 0,
      },
      entries: entries.map((entry) => ({
        entryKind: entry.entryKind,
        walletEffect: entry.walletEffect,
        amount: entry.amount,
        status: entry.status,
        reference: entry.reference || null,
        createdAt: entry.createdAt,
      })),
    });

    const signingSecret =
      process.env.STATEMENT_SIGNING_SECRET ||
      process.env.JWT_SECRET ||
      "naijatalk-dev-statement";
    const statementSignature = crypto
      .createHmac("sha256", signingSecret)
      .update(signaturePayload)
      .digest("hex");

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({ message: "Statement PDF scatter: " + err.message });
      }
    });
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"wallet-statement-${generatedAt
          .toISOString()
          .slice(0, 10)}.pdf\"`
      );
      res.setHeader("X-Statement-Id", statementId);
      res.setHeader("X-Statement-Signature", statementSignature);
      return res.send(pdfBuffer);
    });

    const pageLeft = 40;
    const pageTop = 40;
    const tableWidth = 515;
    const pageBottomY = 802;
    const formatPdfCurrency = (kobo = 0) =>
      `NGN ${(Number(kobo || 0) / 100).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    const toTitleCase = (value = "") =>
      String(value)
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    const truncate = (value = "", max = 24) => {
      const raw = String(value || "");
      if (raw.length <= max) return raw;
      return `${raw.slice(0, Math.max(0, max - 1))}…`;
    };

    const drawTopHeader = (continued = false) => {
      doc.rect(pageLeft, pageTop, tableWidth, 64).fill("#14532d");
      doc
        .fillColor("#ffffff")
        .fontSize(20)
        .text(
          continued ? "NaijaTalk Wallet Statement (Continued)" : "NaijaTalk Wallet Statement",
          pageLeft + 16,
          pageTop + 14
        );
      doc
        .fontSize(9)
        .text(`ID: ${statementId}`, pageLeft + 16, pageTop + 44, {
          width: tableWidth - 32,
        });
      doc.fillColor("#0f172a");
    };

    const drawSummaryCard = (x, y, label, value) => {
      doc.rect(x, y, 164, 52).fillAndStroke("#ffffff", "#cbd5e1");
      doc
        .fillColor("#64748b")
        .fontSize(9)
        .text(label, x + 10, y + 10, { width: 144, align: "left" });
      doc
        .fillColor("#0f172a")
        .fontSize(12)
        .text(value, x + 10, y + 26, { width: 144, align: "left" });
    };

    const columns = [
      { label: "Date", width: 95, key: "date" },
      { label: "Type", width: 110, key: "type" },
      { label: "Status", width: 60, key: "status" },
      { label: "Amount", width: 80, key: "amount" },
      { label: "Counterparty", width: 85, key: "counterparty" },
      { label: "Listing", width: 85, key: "listing" },
    ];

    const drawTableHeader = (y) => {
      let x = pageLeft;
      for (const col of columns) {
        doc.rect(x, y, col.width, 20).fillAndStroke("#f1f5f9", "#cbd5e1");
        doc
          .fillColor("#334155")
          .fontSize(8)
          .text(col.label, x + 6, y + 6, { width: col.width - 12, align: "left" });
        x += col.width;
      }
    };

    const drawTableRow = (y, cells) => {
      let x = pageLeft;
      for (let index = 0; index < columns.length; index += 1) {
        const col = columns[index];
        doc.rect(x, y, col.width, 20).fillAndStroke("#ffffff", "#e2e8f0");
        doc
          .fillColor("#0f172a")
          .fontSize(8)
          .text(cells[index], x + 6, y + 6, {
            width: col.width - 12,
            align: col.key === "amount" ? "right" : "left",
          });
        x += col.width;
      }
    };

    drawTopHeader();

    doc
      .fillColor("#334155")
      .fontSize(9)
      .text(`Generated: ${generatedAt.toLocaleString("en-NG")}`, pageLeft, 118)
      .text(`User: ${req.user.email}`, pageLeft, 132)
      .text(
        `Filters: ${toTitleCase(statusRaw)} | ${dateFromRaw || "N/A"} - ${dateToRaw || "N/A"}`,
        pageLeft,
        146
      );

    drawSummaryCard(pageLeft, 168, "TOTAL BALANCE", formatPdfCurrency(wallet?.balance || 0));
    drawSummaryCard(
      pageLeft + 176,
      168,
      "AVAILABLE",
      formatPdfCurrency(wallet?.availableBalance || wallet?.balance || 0)
    );
    drawSummaryCard(pageLeft + 352, 168, "HELD", formatPdfCurrency(wallet?.heldBalance || 0));

    doc.fillColor("#0f172a").fontSize(11).text("Activity", pageLeft, 238);
    let tableY = 256;
    drawTableHeader(tableY);
    tableY += 20;

    if (!entries.length) {
      doc.rect(pageLeft, tableY, tableWidth, 24).fillAndStroke("#ffffff", "#e2e8f0");
      doc
        .fillColor("#64748b")
        .fontSize(9)
        .text("No transactions for selected filters.", pageLeft + 8, tableY + 8);
      tableY += 24;
    } else {
      for (const entry of entries) {
        if (tableY + 20 > pageBottomY - 52) {
          doc.addPage();
          drawTopHeader(true);
          tableY = 122;
          drawTableHeader(tableY);
          tableY += 20;
        }

        const amountValue = entry.walletEffect !== 0 ? entry.walletEffect : entry.amount;
        const amountText = `${amountValue >= 0 ? "+" : "-"}${formatPdfCurrency(
          Math.abs(amountValue)
        )}`;
        const dateText = new Date(entry.createdAt).toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        drawTableRow(tableY, [
          truncate(dateText, 22),
          truncate(toTitleCase(entry.entryKind || "activity"), 22),
          truncate(toTitleCase(entry.status || "completed"), 12),
          truncate(amountText, 18),
          truncate(entry.counterparty || "-", 16),
          truncate(entry.listingTitle || "-", 16),
        ]);
        tableY += 20;
      }
    }

    if (tableY + 28 > pageBottomY) {
      doc.addPage();
      drawTopHeader(true);
      tableY = 122;
    }
    doc
      .fillColor("#64748b")
      .fontSize(8)
      .text(
        `HMAC-SHA256 Signature: ${statementSignature} | Keep this statement for audits/disputes.`,
        pageLeft,
        tableY + 16,
        { width: tableWidth }
      );

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Statement PDF scatter: " + err.message });
  }
};

export const requestPayout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const payoutAmount = validatePayoutAmount(req.body?.amount);
    if (!payoutAmount.ok) {
      return res.status(400).json({ message: payoutAmount.message });
    }
    const amountKobo = payoutAmount.amountKobo;

    const payoutRecipient = formatPayoutRecipient(req.body?.payoutDetails || {});
    let responsePayload = null;
    await session.withTransaction(async () => {
      await ensureWalletBalanceFields(req.user._id, { session });
      const pendingCount = await Transaction.countDocuments({
        senderId: req.user._id,
        type: "payout",
        status: "pending",
      }).session(session);
      if (!canCreatePendingPayout(pendingCount)) {
        const error = new Error("Too many pending payouts. Wait for admin review.");
        error.status = 400;
        throw error;
      }

      const wallet = await Wallet.findOneAndUpdate(
        { userId: req.user._id, availableBalance: { $gte: amountKobo } },
        { $inc: { availableBalance: -amountKobo, balance: -amountKobo } },
        { new: true, session }
      );
      if (!wallet) {
        const error = new Error("Insufficient wallet balance for payout.");
        error.status = 400;
        throw error;
      }

      const [newPayout] = await Transaction.create(
        [
          {
            senderId: req.user._id,
            receiverId: req.user._id,
            amount: amountKobo,
            type: "payout",
            status: "pending",
            reference: `naijatalk_payout_${Date.now()}_${req.user._id}`,
            recipientId: payoutRecipient,
          },
        ],
        { session }
      );

      await createLedgerEntry({
        userId: req.user._id,
        entryKind: "payout_pending",
        amount: amountKobo,
        walletEffect: -amountKobo,
        status: "pending",
        reference: newPayout.reference,
        recipientId: newPayout.recipientId,
        wallet,
        transactionId: newPayout._id,
        session,
      });

      responsePayload = {
        payout: newPayout,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        heldBalance: wallet.heldBalance || 0,
      };
    });

    return res.status(201).json({
      ...responsePayload,
      message: "Payout request submitted. Admin go review am soon.",
    });
  } catch (err) {
    const msg = err.message || "Payout request scatter.";
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return res.status(status).json({ message: msg });
  } finally {
    await session.endSession();
  }
};

export const listPayoutsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const status = String(req.query.status || "pending");
    const q = String(req.query.q || "").trim();
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;
    const query = { type: "payout" };

    if (["pending", "completed", "failed"].includes(status)) {
      query.status = status;
    }

    if (q) {
      const userMatches = await User.find(
        {
          $or: [
            { email: { $regex: q, $options: "i" } },
            { username: { $regex: q, $options: "i" } },
          ],
        },
        { _id: 1 }
      )
        .limit(500)
        .lean();
      const userIds = userMatches.map((user) => user._id);
      query.$or = [
        { reference: { $regex: q, $options: "i" } },
        { recipientId: { $regex: q, $options: "i" } },
      ];
      if (userIds.length > 0) {
        query.$or.push({ senderId: { $in: userIds } });
      }
    }

    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) {
        createdAt.$gte = parsedFrom;
      }
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }
    if (Object.keys(createdAt).length > 0) {
      query.createdAt = createdAt;
    }

    const [payouts, statsByStatus] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("senderId", "email username")
        .select("amount status reference recipientId createdAt updatedAt senderId"),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = {
      totalAmount: 0,
      totalCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      completedAmount: 0,
      completedCount: 0,
      failedAmount: 0,
      failedCount: 0,
    };
    for (const row of statsByStatus) {
      const statusKey = String(row?._id || "");
      const amount = Number(row?.totalAmount || 0);
      const count = Number(row?.count || 0);
      summary.totalAmount += amount;
      summary.totalCount += count;
      if (statusKey === "pending") {
        summary.pendingAmount = amount;
        summary.pendingCount = count;
      }
      if (statusKey === "completed") {
        summary.completedAmount = amount;
        summary.completedCount = count;
      }
      if (statusKey === "failed") {
        summary.failedAmount = amount;
        summary.failedCount = count;
      }
    }

    return res.json({
      payouts: payouts.map((p) => ({
        _id: p._id,
        amount: p.amount,
        status: p.status,
        reference: p.reference,
        recipientId: p.recipientId || null,
        user: {
          _id: p.senderId?._id || null,
          email: p.senderId?.email || "",
          username: p.senderId?.username || null,
        },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      summary,
      pagination: {
        page,
        pageSize,
        total: summary.totalCount,
        totalPages: Math.max(Math.ceil(summary.totalCount / pageSize), 1),
        hasNext: skip + payouts.length < summary.totalCount,
        hasPrev: page > 1,
      },
      message: "Payout queue loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Payout list scatter: " + err.message });
  }
};

export const getAdminPayoutDetails = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const { payoutId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return res.status(400).json({ message: "Invalid payout id." });
    }

    const payout = await Transaction.findOne({ _id: payoutId, type: "payout" })
      .populate("senderId", "_id email username role isBanned suspendedUntil")
      .lean();
    if (!payout) {
      return res.status(404).json({ message: "Payout no dey." });
    }

    const [wallet, payoutLedger, recentPayouts] = await Promise.all([
      Wallet.findOne({ userId: payout.senderId?._id || payout.senderId })
        .select("balance availableBalance heldBalance updatedAt")
        .lean(),
      WalletLedger.find({
        $or: [{ transactionId: payout._id }, { reference: payout.reference }],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select(
          "_id entryKind walletEffect amount status reference recipientId counterparty createdAt transactionId"
        )
        .lean(),
      Transaction.find({
        senderId: payout.senderId?._id || payout.senderId,
        type: "payout",
      })
        .sort({ createdAt: -1 })
        .limit(12)
        .select("_id amount status reference recipientId createdAt updatedAt")
        .lean(),
    ]);

    return res.json({
      payout: {
        _id: payout._id,
        amount: payout.amount,
        status: payout.status,
        reference: payout.reference || null,
        recipientId: payout.recipientId || null,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
        user: payout.senderId
          ? {
              _id: payout.senderId._id,
              email: payout.senderId.email,
              username: payout.senderId.username || null,
              role: payout.senderId.role || "user",
              isBanned: Boolean(payout.senderId.isBanned),
              suspendedUntil: payout.senderId.suspendedUntil || null,
            }
          : null,
      },
      wallet: {
        balance: Number(wallet?.balance || 0),
        availableBalance: Number(wallet?.availableBalance || 0),
        heldBalance: Number(wallet?.heldBalance || 0),
        updatedAt: wallet?.updatedAt || null,
      },
      payoutLedger: payoutLedger.map((row) => ({
        _id: row._id,
        entryKind: row.entryKind,
        walletEffect: Number(row.walletEffect || 0),
        amount: Number(row.amount || 0),
        status: row.status,
        reference: row.reference || null,
        recipientId: row.recipientId || null,
        counterparty: row.counterparty || null,
        createdAt: row.createdAt,
        transactionId: row.transactionId || null,
      })),
      recentPayouts: recentPayouts.map((row) => ({
        _id: row._id,
        amount: row.amount,
        status: row.status,
        reference: row.reference || null,
        recipientId: row.recipientId || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      message: "Payout details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Payout details scatter: " + err.message });
  }
};

export const getPayoutRollupsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const periodRaw = String(req.query.period || "daily").toLowerCase();
    const period = periodRaw === "monthly" ? "monthly" : "daily";
    const status = String(req.query.status || "all").toLowerCase();
    const timezone = String(req.query.timezone || "Africa/Lagos");

    const match = { type: "payout" };
    if (["pending", "completed", "failed"].includes(status)) {
      match.status = status;
    }

    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }
    if (Object.keys(createdAt).length > 0) match.createdAt = createdAt;

    const dateFormat = period === "monthly" ? "%Y-%m" : "%Y-%m-%d";
    const rollups = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            bucket: {
              $dateToString: {
                format: dateFormat,
                date: "$createdAt",
                timezone,
              },
            },
            status: "$status",
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.bucket": -1 } },
    ]);

    const bucketMap = new Map();
    for (const row of rollups) {
      const bucket = row?._id?.bucket || "unknown";
      const rowStatus = row?._id?.status || "unknown";
      if (!bucketMap.has(bucket)) {
        bucketMap.set(bucket, {
          bucket,
          totalAmount: 0,
          totalCount: 0,
          pendingAmount: 0,
          pendingCount: 0,
          completedAmount: 0,
          completedCount: 0,
          failedAmount: 0,
          failedCount: 0,
        });
      }
      const target = bucketMap.get(bucket);
      const amount = Number(row.amount || 0);
      const count = Number(row.count || 0);
      target.totalAmount += amount;
      target.totalCount += count;
      if (rowStatus === "pending") {
        target.pendingAmount += amount;
        target.pendingCount += count;
      } else if (rowStatus === "completed") {
        target.completedAmount += amount;
        target.completedCount += count;
      } else if (rowStatus === "failed") {
        target.failedAmount += amount;
        target.failedCount += count;
      }
    }

    const buckets = Array.from(bucketMap.values()).sort((a, b) =>
      b.bucket.localeCompare(a.bucket)
    );

    return res.json({
      period,
      timezone,
      buckets,
      message: "Payout rollups loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Rollup scatter: " + err.message });
  }
};

export const getPayoutRollupBucketDetails = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const { bucket } = req.params;
    const periodRaw = String(req.query.period || "daily").toLowerCase();
    const period = periodRaw === "monthly" ? "monthly" : "daily";
    const status = String(req.query.status || "all").toLowerCase();
    const timezone = String(req.query.timezone || "Africa/Lagos");
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;

    const match = { type: "payout" };
    if (["pending", "completed", "failed"].includes(status)) {
      match.status = status;
    }

    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }
    if (Object.keys(createdAt).length > 0) match.createdAt = createdAt;

    const allRows = await Transaction.find(match)
      .sort({ createdAt: -1 })
      .populate("senderId", "_id email username")
      .select("amount status reference recipientId createdAt updatedAt senderId")
      .lean();
    const scopedRows = allRows.filter((row) => getDateBucket(row.createdAt, period, timezone) === bucket);

    const total = scopedRows.length;
    const skip = (page - 1) * pageSize;
    const rows = scopedRows.slice(skip, skip + pageSize);

    const summary = {
      totalAmount: scopedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      totalCount: total,
      pendingCount: scopedRows.filter((row) => row.status === "pending").length,
      completedCount: scopedRows.filter((row) => row.status === "completed").length,
      failedCount: scopedRows.filter((row) => row.status === "failed").length,
    };

    return res.json({
      bucket,
      period,
      timezone,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + rows.length < total,
      },
      rows: rows.map((p) => ({
        _id: p._id,
        amount: p.amount,
        status: p.status,
        reference: p.reference || null,
        recipientId: p.recipientId || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        user: {
          _id: p.senderId?._id || null,
          email: p.senderId?.email || "",
          username: p.senderId?.username || null,
        },
      })),
      message: "Rollup bucket details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Rollup bucket details scatter: " + err.message });
  }
};

const PLATFORM_ENTRY_KIND_FILTER_MAP = {
  platform_fee: ["platform_fee"],
  contest_prize_paid: ["contest_prize_paid"],
};

const buildPlatformWalletEntries = ({ feeRows = [], contestRows = [] }) => {
  const entries = [];

  for (const row of feeRows) {
    const user = row.senderId
      ? {
          _id: String(row.senderId._id),
          email: row.senderId.email || "",
          username: row.senderId.username || null,
          role: row.senderId.role || "user",
        }
      : null;
    entries.push({
      entryId: `tx_${row._id}`,
      source: "transaction",
      sourceId: String(row._id),
      entryKind: "platform_fee",
      direction: "credit",
      amount: Number(row.platformCut || 0),
      walletEffect: Number(row.platformCut || 0),
      status: row.status,
      reference: row.reference || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || row.createdAt,
      type: row.type,
      listingTitle: row.listingId?.title || null,
      user,
      contestTitle: null,
      contestId: null,
      metadata: {},
    });
  }

  for (const row of contestRows) {
    entries.push({
      entryId: `wl_${row._id}`,
      source: "wallet_ledger",
      sourceId: String(row._id),
      entryKind: row.entryKind || "contest_prize_paid",
      direction: "debit",
      amount: Number(row.amount || 0),
      walletEffect: -Math.abs(Number(row.amount || 0)),
      status: row.status,
      reference: row.reference || null,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
      type: null,
      listingTitle: row.listingTitle || null,
      user: row.userId
        ? {
            _id: String(row.userId._id),
            email: row.userId.email || "",
            username: row.userId.username || null,
            role: row.userId.role || "user",
          }
        : null,
      contestTitle: row.contestTitle || null,
      contestId: row.contestId || null,
      metadata: row.metadata || {},
    });
  }

  return entries.sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt).getTime() -
      new Date(a.createdAt || a.updatedAt).getTime()
  );
};

export const getPlatformWalletOverviewForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const createdAt = buildCreatedAtDateRangeFilter(req.query.dateFrom, req.query.dateTo);

    const [platformWallet, feeAgg, contestAgg] = await Promise.all([
      PlatformWallet.findOne().select("balance lastUpdated").lean(),
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            platformCut: { $gt: 0 },
            ...(createdAt ? { createdAt } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$platformCut" },
            totalCount: { $sum: 1 },
          },
        },
      ]),
      WalletLedger.aggregate([
        {
          $match: {
            entryKind: "contest_prize_paid",
            ...(createdAt ? { createdAt } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const credits = Number(feeAgg?.[0]?.totalAmount || 0);
    const creditsCount = Number(feeAgg?.[0]?.totalCount || 0);
    const debits = Number(contestAgg?.[0]?.totalAmount || 0);
    const debitsCount = Number(contestAgg?.[0]?.totalCount || 0);

    return res.json({
      wallet: {
        balance: Number(platformWallet?.balance || 0),
        lastUpdated: platformWallet?.lastUpdated || null,
      },
      summary: {
        totalCredits: credits,
        totalCreditsCount: creditsCount,
        totalDebits: debits,
        totalDebitsCount: debitsCount,
        netFlow: credits - debits,
      },
      dateRange: {
        dateFrom: String(req.query.dateFrom || "") || null,
        dateTo: String(req.query.dateTo || "") || null,
      },
      message: "Platform wallet overview loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Platform wallet overview scatter: " + err.message });
  }
};

export const listPlatformWalletEntriesForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const q = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "all").trim().toLowerCase();
    const entryKindFilter = String(req.query.entryKind || "all").trim().toLowerCase();
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) ? Math.min(Math.max(pageSizeRaw, 1), 200) : 25;

    const createdAt = buildCreatedAtDateRangeFilter(req.query.dateFrom, req.query.dateTo);
    const requestedKinds =
      entryKindFilter in PLATFORM_ENTRY_KIND_FILTER_MAP
        ? PLATFORM_ENTRY_KIND_FILTER_MAP[entryKindFilter]
        : ["platform_fee", "contest_prize_paid"];

    const feePromise = requestedKinds.includes("platform_fee")
      ? Transaction.find({
          platformCut: { $gt: 0 },
          ...(status === "all" ? {} : { status }),
          ...(createdAt ? { createdAt } : {}),
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "_id email username role")
          .populate("listingId", "_id title")
          .select("_id type status reference platformCut createdAt updatedAt senderId listingId")
          .lean()
      : Promise.resolve([]);

    const contestPromise = requestedKinds.includes("contest_prize_paid")
      ? WalletLedger.find({
          entryKind: "contest_prize_paid",
          ...(status === "all" ? {} : { status }),
          ...(createdAt ? { createdAt } : {}),
        })
          .sort({ createdAt: -1 })
          .populate("userId", "_id email username role")
          .select("_id entryKind amount status reference listingTitle metadata createdAt userId")
          .lean()
      : Promise.resolve([]);

    const [feeRowsRaw, contestRowsRaw] = await Promise.all([feePromise, contestPromise]);

    const contestIds = Array.from(
      new Set(
        contestRowsRaw
          .map((row) => row?.metadata?.contestId)
          .filter((contestId) => mongoose.Types.ObjectId.isValid(String(contestId)))
          .map((contestId) => String(contestId))
      )
    );
    const contests = contestIds.length
      ? await Contest.find({ _id: { $in: contestIds } }).select("_id title").lean()
      : [];
    const contestMap = new Map(contests.map((contest) => [String(contest._id), contest.title]));
    const contestRows = contestRowsRaw.map((row) => {
      const contestId =
        row?.metadata?.contestId && mongoose.Types.ObjectId.isValid(String(row.metadata.contestId))
          ? String(row.metadata.contestId)
          : null;
      return {
        ...row,
        contestId,
        contestTitle: contestId ? contestMap.get(contestId) || null : null,
      };
    });

    let entries = buildPlatformWalletEntries({
      feeRows: feeRowsRaw,
      contestRows,
    });

    if (q) {
      entries = entries.filter((entry) => {
        const haystack = [
          entry.reference,
          entry.entryKind,
          entry.type,
          entry.listingTitle,
          entry.contestTitle,
          entry.user?.email,
          entry.user?.username,
          entry.user?._id,
          entry.sourceId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    const total = entries.length;
    const skip = (page - 1) * pageSize;
    const rows = entries.slice(skip, skip + pageSize);

    return res.json({
      entries: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + rows.length < total,
      },
      summary: {
        totalCredits: entries
          .filter((entry) => entry.direction === "credit")
          .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        totalDebits: entries
          .filter((entry) => entry.direction === "debit")
          .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      },
      message: "Platform wallet entries loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Platform wallet entries scatter: " + err.message });
  }
};

export const getPlatformWalletEntryDetailsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const { entryId } = req.params;
    const [prefix, rawId] = String(entryId || "").split("_");
    if (!["tx", "wl"].includes(prefix) || !mongoose.Types.ObjectId.isValid(String(rawId || ""))) {
      return res.status(400).json({ message: "Invalid platform wallet entry id." });
    }

    if (prefix === "tx") {
      const tx = await Transaction.findById(rawId)
        .populate("senderId", "_id email username role isBanned suspendedUntil")
        .populate("receiverId", "_id email username role isBanned suspendedUntil")
        .populate("listingId", "_id title")
        .select(
          "_id senderId receiverId type status amount platformCut reference recipientId listingId createdAt updatedAt"
        )
        .lean();
      if (!tx) return res.status(404).json({ message: "Transaction entry no dey." });

      const relatedLedger = await WalletLedger.find({
        transactionId: tx._id,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select(
          "_id userId entryKind amount walletEffect status reference recipientId counterparty listingTitle createdAt"
        )
        .populate("userId", "_id email username role")
        .lean();

      return res.json({
        entry: {
          entryId: `tx_${tx._id}`,
          source: "transaction",
          sourceId: String(tx._id),
          entryKind: "platform_fee",
          direction: "credit",
          amount: Number(tx.platformCut || 0),
          walletEffect: Number(tx.platformCut || 0),
          status: tx.status,
          reference: tx.reference || null,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt || tx.createdAt,
          type: tx.type,
          listingTitle: tx.listingId?.title || null,
          user: tx.senderId
            ? {
                _id: String(tx.senderId._id),
                email: tx.senderId.email || "",
                username: tx.senderId.username || null,
                role: tx.senderId.role || "user",
              }
            : null,
          contestTitle: null,
          contestId: null,
          metadata: {},
        },
        transaction: tx,
        relatedLedger: relatedLedger.map((row) => ({
          _id: row._id,
          user: row.userId
            ? {
                _id: row.userId._id,
                email: row.userId.email || "",
                username: row.userId.username || null,
                role: row.userId.role || "user",
              }
            : null,
          entryKind: row.entryKind,
          amount: Number(row.amount || 0),
          walletEffect: Number(row.walletEffect || 0),
          status: row.status,
          reference: row.reference || null,
          recipientId: row.recipientId || null,
          counterparty: row.counterparty || null,
          listingTitle: row.listingTitle || null,
          createdAt: row.createdAt,
        })),
        message: "Platform wallet entry details loaded.",
      });
    }

    const ledgerEntry = await WalletLedger.findById(rawId)
      .populate("userId", "_id email username role isBanned suspendedUntil")
      .select(
        "_id userId entryKind amount walletEffect status reference recipientId counterparty listingTitle metadata createdAt transactionId"
      )
      .lean();
    if (!ledgerEntry) return res.status(404).json({ message: "Wallet ledger entry no dey." });

    const contestId =
      ledgerEntry?.metadata?.contestId &&
      mongoose.Types.ObjectId.isValid(String(ledgerEntry.metadata.contestId))
        ? String(ledgerEntry.metadata.contestId)
        : null;
    const [contest, relatedSubmission, relatedTransaction] = await Promise.all([
      contestId ? Contest.findById(contestId).select("_id title prize status").lean() : null,
      ledgerEntry?.metadata?.submissionId &&
      mongoose.Types.ObjectId.isValid(String(ledgerEntry.metadata.submissionId))
        ? ContestSubmission.findById(String(ledgerEntry.metadata.submissionId))
            .select("_id title status voteCount contestId createdAt updatedAt")
            .lean()
        : null,
      ledgerEntry.transactionId
        ? Transaction.findById(ledgerEntry.transactionId)
            .select("_id type status amount platformCut reference recipientId createdAt updatedAt")
            .lean()
        : null,
    ]);

    return res.json({
      entry: {
        entryId: `wl_${ledgerEntry._id}`,
        source: "wallet_ledger",
        sourceId: String(ledgerEntry._id),
        entryKind: ledgerEntry.entryKind || "contest_prize_paid",
        direction: "debit",
        amount: Number(ledgerEntry.amount || 0),
        walletEffect: -Math.abs(Number(ledgerEntry.amount || 0)),
        status: ledgerEntry.status,
        reference: ledgerEntry.reference || null,
        createdAt: ledgerEntry.createdAt,
        updatedAt: ledgerEntry.createdAt,
        type: null,
        listingTitle: ledgerEntry.listingTitle || null,
        user: ledgerEntry.userId
          ? {
              _id: String(ledgerEntry.userId._id),
              email: ledgerEntry.userId.email || "",
              username: ledgerEntry.userId.username || null,
              role: ledgerEntry.userId.role || "user",
            }
          : null,
        contestTitle: contest?.title || null,
        contestId,
        metadata: ledgerEntry.metadata || {},
      },
      ledgerEntry: {
        ...ledgerEntry,
        userId: ledgerEntry.userId
          ? {
              _id: ledgerEntry.userId._id,
              email: ledgerEntry.userId.email || "",
              username: ledgerEntry.userId.username || null,
              role: ledgerEntry.userId.role || "user",
              isBanned: Boolean(ledgerEntry.userId.isBanned),
              suspendedUntil: ledgerEntry.userId.suspendedUntil || null,
            }
          : null,
      },
      contest: contest
        ? {
            _id: contest._id,
            title: contest.title,
            prize: Number(contest.prize || 0),
            status: contest.status,
          }
        : null,
      submission: relatedSubmission
        ? {
            _id: relatedSubmission._id,
            title: relatedSubmission.title || "",
            status: relatedSubmission.status,
            voteCount: Number(relatedSubmission.voteCount || 0),
            contestId: relatedSubmission.contestId || null,
            createdAt: relatedSubmission.createdAt,
            updatedAt: relatedSubmission.updatedAt,
          }
        : null,
      transaction: relatedTransaction || null,
      message: "Platform wallet entry details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Platform wallet entry details scatter: " + err.message });
  }
};

export const dispatchSlaAlertsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const dryRun = String(req.query.dryRun || req.body?.dryRun || "false").toLowerCase() === "true";
    const recipients = getSlaAlertRecipients();
    const snapshot = await buildSlaAlertSnapshot();
    const findings = evaluateSlaAlerts(snapshot.metrics);
    const { sendNow, suppressed } = filterSlaAlertCooldown(findings);

    if (!sendNow.length) {
      return res.json({
        message: findings.length
          ? "SLA breaches detected but currently in cooldown window."
          : "No SLA threshold breaches detected.",
        dryRun,
        recipients,
        thresholds: SLA_ALERT_THRESHOLDS,
        snapshot,
        findings,
        sent: [],
        suppressed,
      });
    }

    if (!dryRun && recipients.length) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const nowIso = new Date().toISOString();
      const lines = [
        "NaijaTalk SLA Alert",
        "",
        `Time: ${nowIso}`,
        `Window: last ${snapshot.windowDays} day(s)`,
        "",
        "Triggered Alerts:",
        ...sendNow.map((row) => `- ${row.label}: ${row.value} (section: ${row.section})`),
        "",
        "Current Metrics:",
        `- pendingPayoutCount: ${snapshot.metrics.pendingPayoutCount}`,
        `- failedPayoutCount: ${snapshot.metrics.failedPayoutCount}`,
        `- payoutFailureRatePct: ${snapshot.metrics.payoutFailureRatePct}%`,
        `- premiumInFlightCount: ${snapshot.metrics.premiumInFlightCount}`,
        `- premiumFailedCount: ${snapshot.metrics.premiumFailedCount}`,
        `- premiumFailureRatePct: ${snapshot.metrics.premiumFailureRatePct}%`,
        `- oldestPendingPayoutHours: ${snapshot.metrics.oldestPendingPayoutHours}`,
        `- oldestPremiumInFlightHours: ${snapshot.metrics.oldestPremiumInFlightHours}`,
        `- mismatchedUsersCount: ${snapshot.metrics.mismatchedUsersCount}`,
        `- highSeverityMismatchCount: ${snapshot.metrics.highSeverityMismatchCount}`,
        "",
        `Admin dashboard: ${frontendUrl}/admin`,
      ];

      await sendEmail({
        to: recipients,
        subject: `[NaijaTalk SLA] ${sendNow.length} threshold breach(es)`,
        text: lines.join("\n"),
      });

      const now = Date.now();
      for (const finding of sendNow) {
        slaAlertLastSentAtByKey.set(finding.key, now);
      }

      await logAdminAction({
        actorId: req.user._id,
        action: "admin.sla_alerts.dispatch",
        reason: `Dispatched ${sendNow.length} SLA alert(s).`,
        metadata: {
          dryRun: false,
          recipients,
          findings: sendNow.map((row) => row.key),
          windowDays: snapshot.windowDays,
        },
      });
    }

    return res.json({
      message: dryRun
        ? `SLA dry-run found ${sendNow.length} alert(s) ready to send.`
        : recipients.length
        ? `Dispatched ${sendNow.length} SLA alert(s).`
        : "SLA alerts detected but no recipients configured.",
      dryRun,
      recipients,
      thresholds: SLA_ALERT_THRESHOLDS,
      snapshot,
      findings,
      sent: sendNow,
      suppressed,
    });
  } catch (err) {
    logger.error("admin.sla_alerts.dispatch.error", { message: err?.message || "unknown error" });
    return res.status(500).json({ message: "SLA alert dispatch scatter: " + err.message });
  }
};

export const detectWalletMismatchesForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const q = String(req.query.q || "").trim();
    const severity = String(req.query.severity || "all").toLowerCase();
    const minDeltaRaw = Number.parseInt(String(req.query.minDeltaKobo || "0"), 10);
    const minDelta = Number.isFinite(minDeltaRaw) ? Math.max(minDeltaRaw, 0) : 0;
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;

    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }
    const [transactions, ledgers] = await Promise.all([
      Transaction.find({
        type: { $in: ["escrow", "tip", "refund", "payout"] },
        status: { $in: ["pending", "completed", "failed"] },
        ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      })
        .select("senderId receiverId type status amount platformCut createdAt")
        .lean(),
      WalletLedger.find({
        transactionId: { $ne: null },
        ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      })
        .select("userId transactionId walletEffect")
        .lean(),
    ]);

    const addToMap = (map, userId, amount, txCount = 0) => {
      if (!userId) return;
      const key = userId.toString();
      const current = map.get(key) || { expectedEffect: 0, txCount: 0 };
      current.expectedEffect += Number(amount || 0);
      current.txCount += txCount;
      map.set(key, current);
    };

    const expectedByUser = new Map();
    for (const tx of transactions) {
      const senderId = toObjectIdString(tx.senderId);
      const receiverId = toObjectIdString(tx.receiverId);
      const platformCut = Number(tx.platformCut || 0);
      const amount = Number(tx.amount || 0);

      if (tx.type === "escrow") {
        if (senderId) addToMap(expectedByUser, senderId, -amount, 1);
        if (receiverId && tx.status === "completed") {
          addToMap(expectedByUser, receiverId, amount - platformCut, 1);
        }
      } else if (tx.type === "tip") {
        if (receiverId && tx.status === "completed") {
          addToMap(expectedByUser, receiverId, amount - platformCut, 1);
        }
      } else if (tx.type === "refund" && tx.status === "completed") {
        if (receiverId) addToMap(expectedByUser, receiverId, amount, 1);
        if (senderId) addToMap(expectedByUser, senderId, -amount, 1);
      } else if (tx.type === "payout") {
        if (senderId) {
          if (tx.status === "failed") addToMap(expectedByUser, senderId, amount, 1);
          if (tx.status === "pending" || tx.status === "completed") {
            addToMap(expectedByUser, senderId, -amount, 1);
          }
        }
      }
    }

    const ledgerByUser = new Map();
    for (const entry of ledgers) {
      const userKey = toObjectIdString(entry.userId);
      if (!userKey) continue;
      const current = ledgerByUser.get(userKey) || { ledgerEffect: 0, ledgerCount: 0 };
      current.ledgerEffect += Number(entry.walletEffect || 0);
      current.ledgerCount += 1;
      ledgerByUser.set(userKey, current);
    }

    const allUserIds = new Set([
      ...Array.from(expectedByUser.keys()),
      ...Array.from(ledgerByUser.keys()),
    ]);

    const mismatches = [];
    for (const userId of allUserIds) {
      const expected = expectedByUser.get(userId) || { expectedEffect: 0, txCount: 0 };
      const ledger = ledgerByUser.get(userId) || { ledgerEffect: 0, ledgerCount: 0 };
      const delta = expected.expectedEffect - ledger.ledgerEffect;
      if (delta !== 0 || expected.txCount !== ledger.ledgerCount) {
        mismatches.push({
          userId,
          expectedEffect: expected.expectedEffect,
          ledgerEffect: ledger.ledgerEffect,
          delta,
          transactionCount: expected.txCount,
          ledgerCount: ledger.ledgerCount,
          severity:
            Math.abs(delta) >= 10000
              ? "high"
              : Math.abs(delta) >= 1000
              ? "medium"
              : "low",
        });
      }
    }

    let scoped = mismatches;
    if (severity === "high" || severity === "medium" || severity === "low") {
      scoped = scoped.filter((x) => x.severity === severity);
    }
    if (minDelta > 0) {
      scoped = scoped.filter((x) => Math.abs(x.delta) >= minDelta);
    }
    if (q) {
      const matchedUsers = await User.find(
        {
          $or: [
            { email: { $regex: q, $options: "i" } },
            { username: { $regex: q, $options: "i" } },
          ],
        },
        { _id: 1 }
      )
        .limit(1000)
        .lean();
      const matchedIds = new Set(matchedUsers.map((u) => String(u._id)));
      scoped = scoped.filter((row) => matchedIds.has(String(row.userId)));
    }

    scoped.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const total = scoped.length;
    const skip = (page - 1) * pageSize;
    const paged = scoped.slice(skip, skip + pageSize);

    const pageUserIds = [...new Set(paged.map((row) => row.userId))];
    const users = await User.find({ _id: { $in: pageUserIds } }, "_id email username role").lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const highCount = scoped.filter((x) => x.severity === "high").length;
    const mediumCount = scoped.filter((x) => x.severity === "medium").length;
    const lowCount = scoped.filter((x) => x.severity === "low").length;

    return res.json({
      summary: {
        totalUsersChecked: allUserIds.size,
        mismatchedUsers: total,
        highCount,
        mediumCount,
        lowCount,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + paged.length < total,
      },
      mismatches: paged.map((row) => ({
        ...row,
        user: userMap.get(String(row.userId))
          ? {
              _id: userMap.get(String(row.userId))._id,
              email: userMap.get(String(row.userId)).email,
              username: userMap.get(String(row.userId)).username || null,
              role: userMap.get(String(row.userId)).role || "user",
            }
          : null,
      })),
      message: "Wallet mismatch scan completed.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Mismatch scan scatter: " + err.message });
  }
};

export const getWalletMismatchDetailsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }

    const [user, wallet, transactions, ledgers] = await Promise.all([
      User.findById(userId).select("_id email username role isBanned suspendedUntil").lean(),
      Wallet.findOne({ userId }).select("balance availableBalance heldBalance updatedAt").lean(),
      Transaction.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
        type: { $in: ["escrow", "tip", "refund", "payout"] },
        status: { $in: ["pending", "completed", "failed"] },
        ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(80)
        .select("senderId receiverId type status amount platformCut reference recipientId createdAt")
        .lean(),
      WalletLedger.find({
        userId,
        transactionId: { $ne: null },
        ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(120)
        .select(
          "_id entryKind amount walletEffect status reference recipientId counterparty transactionId createdAt"
        )
        .lean(),
    ]);

    const addToTotal = (obj, field, value) => {
      obj[field] = Number(obj[field] || 0) + Number(value || 0);
    };
    const expected = { effect: 0, txCount: 0 };
    for (const tx of transactions) {
      const senderId = toObjectIdString(tx.senderId);
      const receiverId = toObjectIdString(tx.receiverId);
      const amount = Number(tx.amount || 0);
      const platformCut = Number(tx.platformCut || 0);
      const isSender = senderId === userId;
      const isReceiver = receiverId === userId;
      if (!isSender && !isReceiver) continue;

      if (tx.type === "escrow") {
        if (isSender) addToTotal(expected, "effect", -amount);
        if (isReceiver && tx.status === "completed") addToTotal(expected, "effect", amount - platformCut);
      } else if (tx.type === "tip") {
        if (isReceiver && tx.status === "completed") addToTotal(expected, "effect", amount - platformCut);
      } else if (tx.type === "refund" && tx.status === "completed") {
        if (isReceiver) addToTotal(expected, "effect", amount);
        if (isSender) addToTotal(expected, "effect", -amount);
      } else if (tx.type === "payout" && isSender) {
        if (tx.status === "failed") addToTotal(expected, "effect", amount);
        if (tx.status === "pending" || tx.status === "completed") addToTotal(expected, "effect", -amount);
      }
      expected.txCount += 1;
    }

    const ledgerEffect = ledgers.reduce((sum, row) => sum + Number(row.walletEffect || 0), 0);
    const delta = expected.effect - ledgerEffect;
    const severity =
      Math.abs(delta) >= 10000 ? "high" : Math.abs(delta) >= 1000 ? "medium" : "low";

    return res.json({
      user: user
        ? {
            _id: user._id,
            email: user.email,
            username: user.username || null,
            role: user.role || "user",
            isBanned: Boolean(user.isBanned),
            suspendedUntil: user.suspendedUntil || null,
          }
        : null,
      wallet: {
        balance: Number(wallet?.balance || 0),
        availableBalance: Number(wallet?.availableBalance || 0),
        heldBalance: Number(wallet?.heldBalance || 0),
        updatedAt: wallet?.updatedAt || null,
      },
      summary: {
        expectedEffect: Number(expected.effect || 0),
        ledgerEffect: Number(ledgerEffect || 0),
        delta: Number(delta || 0),
        transactionCount: expected.txCount,
        ledgerCount: ledgers.length,
        severity,
      },
      recentTransactions: transactions,
      recentLedger: ledgers,
      message: "Wallet mismatch details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Mismatch details scatter: " + err.message });
  }
};

export const listUserRiskSignalsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const q = String(req.query.q || "").trim();
    const severityFilter = String(req.query.severity || "all").toLowerCase();
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const windowDaysRaw = Number.parseInt(String(req.query.windowDays || "14"), 10);
    const windowDays = Number.isFinite(windowDaysRaw)
      ? Math.min(Math.max(windowDaysRaw, 1), 90)
      : 14;
    const sinceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const [failedPayoutAgg, payoutTotalAgg, pendingPayoutAgg, tipReceivedAgg, allUsers] =
      await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              type: "payout",
              status: "failed",
              createdAt: { $gte: sinceDate },
            },
          },
          { $group: { _id: "$senderId", count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              type: "payout",
              status: { $in: ["failed", "completed", "pending"] },
              createdAt: { $gte: sinceDate },
            },
          },
          { $group: { _id: "$senderId", count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { type: "payout", status: "pending" } },
          { $group: { _id: "$senderId", count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              type: "tip",
              status: "completed",
              createdAt: { $gte: sinceDate },
            },
          },
          {
            $group: {
              _id: "$receiverId",
              count: { $sum: 1 },
              totalKobo: { $sum: "$amount" },
              senders: { $addToSet: "$senderId" },
            },
          },
          {
            $project: {
              count: 1,
              totalKobo: 1,
              uniqueSenders: { $size: "$senders" },
            },
          },
        ]),
        User.find({}, "_id email username role isBanned suspendedUntil").lean(),
      ]);

    const toMap = (rows) => new Map(rows.map((row) => [String(row._id), row]));
    const failedMap = toMap(failedPayoutAgg);
    const payoutTotalMap = toMap(payoutTotalAgg);
    const pendingMap = toMap(pendingPayoutAgg);
    const tipMap = toMap(tipReceivedAgg);

    let scopedUsers = allUsers;
    if (q) {
      const lowered = q.toLowerCase();
      scopedUsers = allUsers.filter((user) => {
        const email = String(user.email || "").toLowerCase();
        const username = String(user.username || "").toLowerCase();
        return email.includes(lowered) || username.includes(lowered);
      });
    }

    const rows = scopedUsers
      .map((user) => {
        const userId = String(user._id);
        const metrics = {
          failedPayoutCount: Number(failedMap.get(userId)?.count || 0),
          payoutTotalCount: Number(payoutTotalMap.get(userId)?.count || 0),
          pendingPayoutCount: Number(pendingMap.get(userId)?.count || 0),
          tipReceivedCount: Number(tipMap.get(userId)?.count || 0),
          tipReceivedUniqueSenders: Number(tipMap.get(userId)?.uniqueSenders || 0),
          tipReceivedTotalKobo: Number(tipMap.get(userId)?.totalKobo || 0),
        };
        const signal = computeUserRiskSignal(metrics);
        return {
          user: {
            _id: user._id,
            email: user.email,
            username: user.username || null,
            role: user.role || "user",
            isBanned: Boolean(user.isBanned),
            suspendedUntil: user.suspendedUntil || null,
          },
          metrics,
          ...signal,
        };
      })
      .filter((row) =>
        severityFilter === "all" ? row.severity !== "none" : row.severity === severityFilter
      )
      .sort((a, b) => b.score - a.score || b.metrics.tipReceivedTotalKobo - a.metrics.tipReceivedTotalKobo);

    const total = rows.length;
    const skip = (page - 1) * pageSize;
    const paged = rows.slice(skip, skip + pageSize);
    const summary = {
      totalFlagged: total,
      high: rows.filter((row) => row.severity === "high").length,
      medium: rows.filter((row) => row.severity === "medium").length,
      low: rows.filter((row) => row.severity === "low").length,
      windowDays,
      since: sinceDate.toISOString(),
    };

    return res.json({
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + paged.length < total,
      },
      rows: paged,
      message: "User risk signals loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Risk signal scan scatter: " + err.message });
  }
};

export const decidePayout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const { payoutId } = req.params;
    const approve = Boolean(req.body?.approve);
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return res.status(400).json({ message: "Invalid payout id." });
    }

    let payout = null;
    await session.withTransaction(async () => {
      payout = await Transaction.findOneAndUpdate(
        { _id: payoutId, type: "payout", status: "pending" },
        { $set: { status: approve ? "completed" : "failed", updatedAt: new Date() } },
        { new: true, session }
      );
      if (!payout) {
        const error = new Error("Payout not found or already processed.");
        error.status = 400;
        throw error;
      }

      if (!approve) {
        await ensureWalletBalanceFields(payout.senderId, { session });
        const wallet = await Wallet.findOneAndUpdate(
          { userId: payout.senderId },
          { $inc: { availableBalance: payout.amount, balance: payout.amount } },
          { new: true, session }
        );
        await createLedgerEntry({
          userId: payout.senderId,
          entryKind: "payout_reversed",
          amount: payout.amount,
          walletEffect: payout.amount,
          status: "completed",
          reference: payout.reference,
          recipientId: payout.recipientId || null,
          wallet,
          transactionId: payout._id,
          session,
        });
      } else {
        const wallet = await Wallet.findOne({ userId: payout.senderId })
          .select("balance availableBalance heldBalance updatedAt")
          .session(session);
        await createLedgerEntry({
          userId: payout.senderId,
          entryKind: "payout_completed",
          amount: payout.amount,
          walletEffect: 0,
          status: "completed",
          reference: payout.reference,
          recipientId: payout.recipientId || null,
          wallet,
          transactionId: payout._id,
          session,
        });
      }

      await logAdminAction({
        actorId: req.user._id,
        targetUserId: payout.senderId,
        action: approve ? "payout.approve" : "payout.reject",
        metadata: {
          payoutId: payout._id,
          reference: payout.reference || null,
          amount: payout.amount,
          recipientId: payout.recipientId || null,
        },
        session,
      });
    });

    return res.json({
      payout,
      message: approve
        ? "Payout approved successfully."
        : "Payout rejected and funds refunded.",
    });
  } catch (err) {
    const msg = err.message || "Payout decision scatter.";
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return res.status(status).json({ message: msg });
  } finally {
    await session.endSession();
  }
};

// export const sendTip = async (req, res) => {
//   const { receiverId, amount } = req.body;
//   const senderId = req.user._id;

//   try {
//     if (!mongoose.Types.ObjectId.isValid(receiverId)) {
//       return res.status(400).json({ message: "Invalid receiver ID—check am!" });
//     }
//     if (!amount || ![50, 100, 200].includes(amount)) {
//       return res
//         .status(400)
//         .json({ message: "Tip must be ₦50, ₦100, or ₦200—abeg adjust!" });
//     }

//     const receiver = await User.findById(receiverId);
//     if (!receiver) return res.status(404).json({ message: "Receiver no dey!" });

//     const senderWallet = await Wallet.findOne({ userId: senderId });
//     const senderBalance = senderWallet ? senderWallet.balance / 100 : 0;
//     if (senderBalance < amount) {
//       return res.status(400).json({ message: "Funds no dey—top up!" });
//     }

//     const reference = `naijatalk_tip_${Date.now()}`;
//     const platformCut = amount * 0.1;
//     const transaction = new Transaction({
//       senderId,
//       receiverId,
//       amount: amount * 100,
//       platformCut: platformCut * 100,
//       reference,
//       type: "tip",
//       status: "pending",
//     });
//     await transaction.save();

//     const callbackUrl = `${process.env.FRONTEND_URL}/threads?reference=${reference}&receiverId=${receiverId}`;
//     console.log(
//       `[sendTip] Initiating Paystack: ref=${reference}, callback=${callbackUrl}`
//     );

//     const response = await axios.post(
//       "https://api.paystack.co/transaction/initialize",
//       {
//         email: req.user.email,
//         amount: amount * 100,
//         reference,
//         callback_url: callbackUrl,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(`[sendTip] Paystack response:`, response.data);

//     if (response.data.status) {
//       res.json({
//         paymentLink: response.data.data.authorization_url,
//         reference,
//         message: "Tip dey go—abeg complete am!",
//       });
//     } else {
//       throw new Error("Tip init scatter!");
//     }
//   } catch (err) {
//     console.error("[sendTip] Error:", err.response?.data || err.message);
//     res.status(500).json({ message: "Tip scatter: " + (err.message || err) });
//   }
// };

export const sendTip = async (req, res) => {
  const { receiverId, amount, threadId, replyId } = req.body; // Added threadId/replyId
  const senderId = req.user._id;
  let reference = "";

  try {
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID—check am!" });
    }
    if (!amount || ![50, 100, 200].includes(amount)) {
      return res
        .status(400)
        .json({ message: "Tip must be ₦50, ₦100, or ₦200—abeg adjust!" });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res
        .status(400)
        .json({ message: "You no fit tip yourself, bros!" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver no dey!" });

    // Cooldown check (added below in step 4)
    const startOfDay = getLagosStartOfDayUTCDate();
    const existingTip = await Transaction.findOne({
      senderId,
      [threadId ? "threadId" : "replyId"]: threadId || replyId,
      type: "tip",
      status: "completed",
      createdAt: { $gte: startOfDay },
    });
    if (existingTip) {
      return res.status(400).json({ message: "You don tip this one today!" });
    }

    reference = `naijatalk_tip_${Date.now()}`;
    const platformCut = amount * 0.1;
    const transaction = new Transaction({
      senderId,
      receiverId,
      amount: amount * 100,
      platformCut: platformCut * 100,
      reference,
      type: "tip",
      status: "pending",
      ...(threadId ? { threadId } : { replyId }), // Add threadId or replyId
    });
    await transaction.save();

    const callbackUrl = `${process.env.FRONTEND_URL}/tip/success?reference=${reference}&receiverId=${receiverId}`;
    logger.info("tip.initiate.start", {
      reference,
      senderId: senderId?.toString?.() || null,
      receiverId: receiverId?.toString?.() || String(receiverId || ""),
    });

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl, // Updated to /tip/success
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info("tip.initiate.response", {
      reference,
      status: Boolean(response.data?.status),
    });

    if (response.data.status) {
      res.json({
        paymentLink: response.data.data.authorization_url,
        reference,
        message: "Tip dey go—abeg complete am!",
      });
    } else {
      throw new Error("Tip init scatter!");
    }
  } catch (err) {
    logger.error("tip.initiate.error", {
      reference: typeof reference === "string" ? reference : null,
      senderId: senderId?.toString?.() || null,
      error: err.response?.data || err.message,
    });
    res.status(500).json({ message: "Tip scatter: " + (err.message || err) });
  }
};

export const hasTipped = async (req, res) => {
  const { threadId, replyId } = req.query;
  const senderId = req.user._id;

  try {
    if (!threadId && !replyId) {
      return res.status(400).json({ message: "Thread or reply ID must dey!" });
    }

    const startOfDay = getLagosStartOfDayUTCDate();
    const existingTip = await Transaction.findOne({
      senderId,
      [threadId ? "threadId" : "replyId"]: threadId || replyId,
      type: "tip",
      status: "completed",
      createdAt: { $gte: startOfDay },
    });

    res.json({
      hasTipped: !!existingTip,
      message: existingTip ? "You don tip this one today!" : "You fit tip am!",
    });
  } catch (err) {
    logger.error("tip.has_tipped.error", {
      senderId: senderId?.toString?.() || null,
      threadId: String(threadId || ""),
      replyId: String(replyId || ""),
      error: err.message,
    });
    res.status(500).json({ message: "Check scatter: " + err.message });
  }
};

export const verifyTip = async (req, res) => {
  const { reference, receiverId } = req.body;
  const senderId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID—check am!" });
    }

    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction no dey!" });
    }
    if (transaction.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "No be your transaction!" });
    }
    if (transaction.receiverId.toString() !== receiverId.toString()) {
      return res.status(400).json({ message: "Receiver mismatch for this reference!" });
    }
    if (transaction.status === "completed") {
      return res.status(200).json({ message: "Tip already verified—chill!" });
    }

    logger.info("tip.verify.start", {
      reference,
      senderId: senderId?.toString?.() || null,
      receiverId: receiverId?.toString?.() || String(receiverId || ""),
    });

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );
    logger.info("tip.verify.response", {
      reference,
      paystackStatus: Boolean(response.data?.status),
      txStatus: response.data?.data?.status || null,
    });

    if (response.data.status && response.data.data.status === "success") {
      const paystackAmount = response.data.data.amount;
      const platformCut = transaction.platformCut || paystackAmount * 0.1;
      const receiverAmount = paystackAmount - platformCut;

      if (
        response.data.data.reference !== reference ||
        response.data.data.customer?.email?.toLowerCase() !== req.user.email.toLowerCase() ||
        paystackAmount !== transaction.amount
      ) {
        return res.status(400).json({ message: "Paystack verification details mismatch!" });
      }

      const tx = await Transaction.findOneAndUpdate(
        { _id: transaction._id, status: "pending" },
        {
          $set: {
            status: "completed",
            amount: paystackAmount,
            platformCut,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );
      if (!tx) {
        throw new Error("Transaction no longer pending.");
      }
      logger.info("tip.verify.transaction_updated", {
        reference,
        transactionId: tx._id?.toString?.() || null,
      });

      const receiverWallet = await Wallet.findOneAndUpdate(
        { userId: receiverId },
        {
          $inc: { availableBalance: receiverAmount, balance: receiverAmount },
          $setOnInsert: { heldBalance: 0 },
        },
        { new: true, upsert: true }
      );
      logger.info("tip.verify.receiver_wallet_updated", {
        reference,
        receiverId: receiverId?.toString?.() || String(receiverId || ""),
        balance: Number(receiverWallet?.balance || 0),
      });
      await createLedgerEntry({
        userId: receiverId,
        entryKind: "tip_received",
        amount: paystackAmount,
        walletEffect: receiverAmount,
        status: "completed",
        reference,
        counterparty: req.user.username || req.user.email,
        wallet: receiverWallet,
        transactionId: tx._id,
      });

      let platformWallet = await PlatformWallet.findOne();
      if (!platformWallet) {
        platformWallet = new PlatformWallet({ balance: 0 });
      }
      platformWallet.balance += platformCut;
      platformWallet.lastUpdated = Date.now();
      await platformWallet.save();
      logger.info("tip.verify.platform_wallet_updated", {
        reference,
        balance: Number(platformWallet?.balance || 0),
      });

      res.json({
        message: `Tip of ₦${receiverAmount / 100} sent—enjoy the vibes!`,
      });
    } else {
      transaction.status = "failed";
      await transaction.save();
      logger.warn("tip.verify.failed", { reference });
      res.status(400).json({ message: "Tip no work—Paystack no gree!" });
    }
  } catch (err) {
    logger.error("tip.verify.error", {
      reference: typeof reference === "string" ? reference : null,
      senderId: senderId?.toString?.() || null,
      error: err.response?.data || err.message,
    });
    const knownBadRequest = err.message?.includes("no longer pending");
    res.status(knownBadRequest ? 400 : 500).json({
      message: knownBadRequest
        ? err.message
        : "Verify scatter: " + (err.response?.data?.message || err.message),
    });
  }
};
