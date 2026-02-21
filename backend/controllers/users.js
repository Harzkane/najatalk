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
import { syncPremiumAccessState } from "../utils/premiumAccess.js";

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

const formatPayoutRecipient = (details = {}) => {
  const accountName = String(details.accountName || "").trim();
  const accountNumber = String(details.accountNumber || "").trim();
  const bankName = String(details.bankName || "").trim();
  const channel = String(details.channel || "bank_transfer").trim();
  const maskedAccount =
    accountNumber.length >= 4
      ? `****${accountNumber.slice(-4)}`
      : accountNumber || "****";
  return `${accountName || "Account"} (${maskedAccount}) - ${bankName || channel
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
}) => {
  const snapshot = getWalletSnapshot(wallet);
  await WalletLedger.create({
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
  });
};

const ensureWalletBalanceFields = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
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
    await wallet.save();
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

export const banUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    res.json({ message: "User don dey banned—e don finish!" });
  } catch (err) {
    res.status(500).json({ message: "Ban scatter: " + err.message });
  }
};

export const getBannedUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const bannedUsers = await User.find({ isBanned: true }).select(
      "email appealReason appealStatus"
    );
    res.json({ bannedUsers, message: "Banned users dey here—check am!" });
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
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User no dey!" });
    if (!user.isBanned)
      return res
        .status(400)
        .json({ message: "User no dey banned—no need to unban!" });

    const update = approve
      ? { isBanned: false, appealStatus: "approved", appealReason: null }
      : { appealStatus: "rejected" };
    await User.findByIdAndUpdate(userId, update, { new: true });
    res.json({
      message: approve
        ? "User don dey unbanned—welcome back!"
        : "Appeal rejected—stay banned!",
    });
  } catch (err) {
    res.status(500).json({ message: "Unban scatter: " + err.message });
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
    if (req.user._id.toString() !== userId && req.user.role !== "admin") {
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
  try {
    const amount = Number(req.body?.amount);
    const amountKobo = Math.round(amount * 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Payout amount must be valid." });
    }
    if (!Number.isInteger(amountKobo) || amountKobo < 50000) {
      return res.status(400).json({ message: "Minimum payout is ₦500." });
    }

    const payoutRecipient = formatPayoutRecipient(req.body?.payoutDetails || {});
    await ensureWalletBalanceFields(req.user._id);
    const pendingCount = await Transaction.countDocuments({
      senderId: req.user._id,
      type: "payout",
      status: "pending",
    });
    if (pendingCount >= 3) {
      return res
        .status(400)
        .json({ message: "Too many pending payouts. Wait for admin review." });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, availableBalance: { $gte: amountKobo } },
      { $inc: { availableBalance: -amountKobo, balance: -amountKobo } },
      { new: true }
    );
    if (!wallet) {
      return res
        .status(400)
        .json({ message: "Insufficient wallet balance for payout." });
    }

    const newPayout = await Transaction.create({
      senderId: req.user._id,
      receiverId: req.user._id,
      amount: amountKobo,
      type: "payout",
      status: "pending",
      reference: `naijatalk_payout_${Date.now()}_${req.user._id}`,
      recipientId: payoutRecipient,
    });

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
    });

    return res.status(201).json({
      payout: newPayout,
      balance: wallet.balance,
      availableBalance: wallet.availableBalance,
      heldBalance: wallet.heldBalance || 0,
      message: "Payout request submitted. Admin go review am soon.",
    });
  } catch (err) {
    const msg = err.message || "Payout request scatter.";
    const isUserError =
      msg.includes("Insufficient") ||
      msg.includes("Minimum payout") ||
      msg.includes("Wallet no dey") ||
      msg.includes("Too many pending") ||
      msg.includes("valid");
    return res.status(isUserError ? 400 : 500).json({ message: msg });
  }
};

export const listPayoutsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const status = String(req.query.status || "pending");
    const limitRaw = Number.parseInt(String(req.query.limit || "200"), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 1000)
      : 200;
    const query = { type: "payout" };

    if (["pending", "completed", "failed"].includes(status)) {
      query.status = status;
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

    const payouts = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "email username")
      .select("amount status reference recipientId createdAt updatedAt senderId");

    const statsByStatus = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
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
      message: "Payout queue loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Payout list scatter: " + err.message });
  }
};

export const getPayoutRollupsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
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

export const detectWalletMismatchesForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const limitRaw = Number.parseInt(String(req.query.limit || "100"), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 500)
      : 100;

    const [transactions, ledgers] = await Promise.all([
      Transaction.find({
        type: { $in: ["escrow", "tip", "refund", "payout"] },
        status: { $in: ["pending", "completed", "failed"] },
      })
        .select("senderId receiverId type status amount platformCut createdAt")
        .lean(),
      WalletLedger.find({
        transactionId: { $ne: null },
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

    mismatches.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const top = mismatches.slice(0, limit);
    const highCount = mismatches.filter((x) => x.severity === "high").length;
    const mediumCount = mismatches.filter((x) => x.severity === "medium").length;
    const lowCount = mismatches.filter((x) => x.severity === "low").length;

    return res.json({
      summary: {
        totalUsersChecked: allUserIds.size,
        mismatchedUsers: mismatches.length,
        highCount,
        mediumCount,
        lowCount,
      },
      mismatches: top,
      message: "Wallet mismatch scan completed.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Mismatch scan scatter: " + err.message });
  }
};

export const decidePayout = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const { payoutId } = req.params;
    const approve = Boolean(req.body?.approve);
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return res.status(400).json({ message: "Invalid payout id." });
    }

    const payout = await Transaction.findOneAndUpdate(
      { _id: payoutId, type: "payout", status: "pending" },
      { $set: { status: approve ? "completed" : "failed", updatedAt: new Date() } },
      { new: true }
    );
    if (!payout) {
      return res.status(400).json({ message: "Payout not found or already processed." });
    }

    if (!approve) {
      await ensureWalletBalanceFields(payout.senderId);
      const wallet = await Wallet.findOneAndUpdate(
        { userId: payout.senderId },
        { $inc: { availableBalance: payout.amount, balance: payout.amount } },
        { new: true }
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
      });
    } else {
      const wallet = await Wallet.findOne({ userId: payout.senderId }).select(
        "balance availableBalance heldBalance updatedAt"
      );
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
      });
    }

    return res.json({
      payout,
      message: approve
        ? "Payout approved successfully."
        : "Payout rejected and funds refunded.",
    });
  } catch (err) {
    const msg = err.message || "Payout decision scatter.";
    const isUserError =
      msg.includes("not found") ||
      msg.includes("already processed") ||
      msg.includes("Invalid payout");
    return res.status(isUserError ? 400 : 500).json({ message: msg });
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

//     const callbackUrl = `${process.env.FRONTEND_URL}/threads/tip-success?reference=${reference}&receiverId=${receiverId}`;
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

// backend/controllers/users.js

// backend/controllers/users.js
export const sendTip = async (req, res) => {
  const { receiverId, amount } = req.body;
  const senderId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID—check am!" });
    }
    if (!amount || ![50, 100, 200].includes(amount)) {
      return res
        .status(400)
        .json({ message: "Tip must be ₦50, ₦100, or ₦200—abeg adjust!" });
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

    const reference = `naijatalk_tip_${Date.now()}`;
    const platformCut = amount * 0.1;
    const transaction = new Transaction({
      senderId,
      receiverId,
      amount: amount * 100,
      platformCut: platformCut * 100,
      reference,
      type: "tip",
      status: "pending",
    });
    await transaction.save();

    const callbackUrl = `${process.env.FRONTEND_URL}/threads?reference=${reference}&receiverId=${receiverId}`;
    console.log(
      `[sendTip] Initiating Paystack: ref=${reference}, callback=${callbackUrl}`
    );

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[sendTip] Paystack response:`, response.data);

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
    console.error("[sendTip] Error:", err.response?.data || err.message);
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
    console.error("[hasTipped] Error:", err.message);
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

    console.log(
      `[verifyTip] Starting: ref=${reference}, sender=${senderId}, receiver=${receiverId}`
    );

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );
    console.log(`[verifyTip] Paystack response:`, response.data);

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
      console.log(`[verifyTip] Transaction updated: ${tx._id}`);

      const receiverWallet = await Wallet.findOneAndUpdate(
        { userId: receiverId },
        {
          $inc: { availableBalance: receiverAmount, balance: receiverAmount },
          $setOnInsert: { heldBalance: 0 },
        },
        { new: true, upsert: true }
      );
      console.log(
        `[verifyTip] Receiver wallet: ${receiverWallet.balance} kobo total`
      );
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
      console.log(`[verifyTip] Platform wallet: ${platformWallet.balance} kobo`);

      res.json({
        message: `Tip of ₦${receiverAmount / 100} sent—enjoy the vibes!`,
      });
    } else {
      transaction.status = "failed";
      await transaction.save();
      console.log(`[verifyTip] Transaction failed: ${reference}`);
      res.status(400).json({ message: "Tip no work—Paystack no gree!" });
    }
  } catch (err) {
    console.error("[verifyTip] Error:", err.response?.data || err.message);
    const knownBadRequest = err.message?.includes("no longer pending");
    res.status(knownBadRequest ? 400 : 500).json({
      message: knownBadRequest
        ? err.message
        : "Verify scatter: " + (err.response?.data?.message || err.message),
    });
  }
};
