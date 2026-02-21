// backend/controllers/premium.js
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import PremiumPayment from "../models/premiumPayment.js";
import WalletLedger from "../models/walletLedger.js";
import PlatformWallet from "../models/platformWallet.js";
import axios from "axios";
import {
  applyPremiumActivation,
  getPremiumSnapshot,
  syncPremiumAccessState,
} from "../utils/premiumAccess.js";

const PREMIUM_AMOUNT_KOBO = 50000;
const PREMIUM_CURRENCY = "NGN";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeCurrency = (value) => String(value || "").trim().toUpperCase();
const toSafeDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toPaystackSummary = (tx = {}) => ({
  id: tx?.id ? String(tx.id) : null,
  reference: tx?.reference || null,
  status: tx?.status || null,
  amount: Number(tx?.amount || 0),
  currency: normalizeCurrency(tx?.currency || PREMIUM_CURRENCY),
  channel: tx?.channel || null,
  paidAt: tx?.paid_at || tx?.paidAt || null,
  customerEmail: normalizeEmail(tx?.customer?.email),
});

const claimPaymentForProcessing = async (paymentId) =>
  PremiumPayment.findOneAndUpdate(
    { _id: paymentId, status: "initiated" },
    {
      $set: {
        status: "processing",
        lastVerificationAttemptAt: new Date(),
      },
      $inc: { verifyAttempts: 1 },
    },
    { new: true }
  );

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
  const total = Number(wallet.availableBalance || 0) + Number(wallet.heldBalance || 0);
  if (Number(wallet.balance || 0) !== total) {
    wallet.balance = total;
    changed = true;
  }
  if (changed) await wallet.save();
  return wallet;
};

const getWalletSnapshot = (wallet) => ({
  availableBalance: Number(wallet?.availableBalance || 0),
  heldBalance: Number(wallet?.heldBalance || 0),
  balance: Number(
    wallet?.balance || Number(wallet?.availableBalance || 0) + Number(wallet?.heldBalance || 0)
  ),
});

export const initiatePremium = async (req, res) => {
  const { email, _id } = req.user;
  const normalizedEmail = normalizeEmail(email);
  const reference = `naijatalk_premium_${_id}_${Date.now()}`;
  let paymentRecord = null;

  try {
    if (!process.env.PAYSTACK_SECRET || !process.env.FRONTEND_URL) {
      return res.status(500).json({ message: "Payment config missing on server!" });
    }

    paymentRecord = await PremiumPayment.create({
      userId: _id,
      email: normalizedEmail,
      reference,
      amount: PREMIUM_AMOUNT_KOBO,
      currency: PREMIUM_CURRENCY,
      status: "initiated",
    });

    console.log("Initiating premium payment for user:", _id.toString());
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: normalizedEmail,
        amount: PREMIUM_AMOUNT_KOBO,
        currency: PREMIUM_CURRENCY,
        reference,
        metadata: {
          userId: _id.toString(),
          purpose: "premium_subscription",
        },
        callback_url: `${process.env.FRONTEND_URL}/premium/success?reference=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.status) {
      res.json({
        paymentLink: response.data.data.authorization_url,
        reference,
        message: "Payment dey go—abeg complete am!",
      });
    } else {
      paymentRecord.status = "failed";
      await paymentRecord.save();
      throw new Error("Payment init scatter!");
    }
  } catch (err) {
    if (paymentRecord && paymentRecord.status === "initiated") {
      paymentRecord.status = "failed";
      await paymentRecord.save();
    }

    console.error("Premium initiate error:", err.response?.data?.message || err.message);
    res
      .status(500)
      .json({ message: "Premium scatter: " + (err.message || err) });
  }
};

export const verifyPremium = async (req, res) => {
  const reference = String(req.body?.reference || req.query?.reference || "").trim();
  let claimedRecord = null;
  try {
    if (!process.env.PAYSTACK_SECRET) {
      return res.status(500).json({ message: "Payment config missing on server!" });
    }
    if (!reference) {
      return res.status(400).json({ message: "Reference no dey!" });
    }

    const paymentRecord = await PremiumPayment.findOne({
      reference,
      userId: req.user._id,
    });

    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment reference no match this user!" });
    }

    if (paymentRecord.status === "completed") {
      const existingUser = await User.findById(req.user._id).select(
        "_id email flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd"
      );
      if (existingUser) {
        const { changed } = syncPremiumAccessState(existingUser);
        if (changed) await existingUser.save();
      }
      return res.json({
        message: "Premium already activated—enjoy the VIP vibes!",
        user: existingUser || null,
      });
    }

    if (paymentRecord.status === "processing") {
      return res.status(409).json({ message: "Verification in progress. Retry shortly." });
    }
    if (paymentRecord.status !== "initiated") {
      return res.status(400).json({ message: "Payment is not in a verifiable state." });
    }

    claimedRecord = await claimPaymentForProcessing(paymentRecord._id);
    if (!claimedRecord) {
      return res.status(409).json({ message: "Verification already running. Retry shortly." });
    }

    console.log("Verifying premium payment reference:", reference);
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      }
    );

    const paystackTx = response.data?.data;
    const txSummary = toPaystackSummary(paystackTx);
    const isSuccessful =
      response.data?.status === true && paystackTx?.status === "success";
    const amountMatches = txSummary.amount === claimedRecord.amount;
    const referenceMatches = txSummary.reference === claimedRecord.reference;
    const emailMatches = txSummary.customerEmail === claimedRecord.email;
    const currencyMatches = txSummary.currency === normalizeCurrency(claimedRecord.currency);

    if (!isSuccessful || !amountMatches || !referenceMatches || !emailMatches || !currencyMatches) {
      claimedRecord.status = "failed";
      claimedRecord.failureReason = "verification_checks_failed";
      claimedRecord.gatewayResponse = txSummary;
      await claimedRecord.save();
      return res.status(400).json({ message: "Payment verification failed checks." });
    }

    const updatedUser = await User.findById(req.user._id).select(
      "_id email flair isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd premiumLastPaymentRef"
    );
    if (!updatedUser) {
      claimedRecord.status = "failed";
      claimedRecord.failureReason = "user_not_found";
      claimedRecord.gatewayResponse = txSummary;
      await claimedRecord.save();
      return res.status(404).json({ message: "User no dey for premium activation." });
    }
    applyPremiumActivation(updatedUser, { reference });
    await updatedUser.save();

    claimedRecord.status = "completed";
    claimedRecord.verifiedAt = new Date();
    claimedRecord.verificationSource = "manual";
    claimedRecord.failureReason = null;
    claimedRecord.currency = txSummary.currency;
    claimedRecord.channel = txSummary.channel;
    claimedRecord.gatewayTransactionId = txSummary.id;
    const paidAt = txSummary.paidAt ? toSafeDate(txSummary.paidAt) : null;
    claimedRecord.paidAt = paidAt || claimedRecord.paidAt;
    claimedRecord.gatewayResponse = txSummary;
    await claimedRecord.save();

    res.json({
      message: "Premium activated—enjoy the VIP vibes!",
      user: updatedUser,
    });
  } catch (err) {
    if (claimedRecord && claimedRecord.status === "processing") {
      claimedRecord.status = "initiated";
      claimedRecord.failureReason = "verification_retryable_error";
      claimedRecord.gatewayResponse = {
        message: err.response?.data?.message || err.message,
      };
      await claimedRecord.save();
    }
    console.error("Premium verify error:", err.response?.data?.message || err.message);
    res.status(500).json({
      message:
        "Verify scatter: " + (err.response?.data?.message || err.message),
    });
  }
};

export const subscribePremiumWithWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id email isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd premiumLastPaymentRef"
    );
    if (!user) {
      return res.status(404).json({ message: "User no dey for premium activation." });
    }

    const { snapshot } = syncPremiumAccessState(user);
    if (snapshot?.isPremium) {
      return res.status(400).json({ message: "Premium already active on this account." });
    }

    await ensureWalletBalanceFields(req.user._id);
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, availableBalance: { $gte: PREMIUM_AMOUNT_KOBO } },
      {
        $inc: {
          availableBalance: -PREMIUM_AMOUNT_KOBO,
          balance: -PREMIUM_AMOUNT_KOBO,
        },
      },
      { new: true }
    );

    if (!wallet) {
      return res.status(400).json({
        message: "Insufficient wallet balance for premium subscription.",
        amountRequiredKobo: PREMIUM_AMOUNT_KOBO,
      });
    }

    const reference = `wallet_premium_${req.user._id}_${Date.now()}`;
    applyPremiumActivation(user, { reference });
    await user.save();

    const snapshotWallet = getWalletSnapshot(wallet);
    await WalletLedger.create({
      userId: req.user._id,
      entryKind: "premium_subscription",
      amount: PREMIUM_AMOUNT_KOBO,
      walletEffect: -PREMIUM_AMOUNT_KOBO,
      status: "completed",
      reference,
      counterparty: "platform",
      availableBalance: snapshotWallet.availableBalance,
      heldBalance: snapshotWallet.heldBalance,
      balance: snapshotWallet.balance,
      metadata: {
        source: "wallet",
        premiumPlan: "monthly",
      },
    });

    let platformWallet = await PlatformWallet.findOne();
    if (!platformWallet) {
      platformWallet = new PlatformWallet({ balance: 0 });
    }
    platformWallet.balance += PREMIUM_AMOUNT_KOBO;
    platformWallet.lastUpdated = Date.now();
    await platformWallet.save();

    return res.json({
      message: "Premium activated from wallet.",
      chargedAmountKobo: PREMIUM_AMOUNT_KOBO,
      user,
    });
  } catch (err) {
    return res.status(500).json({ message: "Wallet premium scatter: " + err.message });
  }
};

export const handlePaystackWebhook = async (req, res) => {
  let claimedRecord = null;
  try {
    const payload = req.body;
    if (payload?.event !== "charge.success" || payload?.data?.status !== "success") {
      return res.status(200).send("Webhook ignored");
    }

    const reference = String(payload?.data?.reference || "").trim();
    const txSummary = toPaystackSummary(payload?.data);
    const email = txSummary.customerEmail;
    const amount = txSummary.amount;

    if (!reference || !email || !Number.isFinite(amount)) {
      return res.status(200).send("Webhook missing required fields");
    }

    const paymentRecord = await PremiumPayment.findOne({
      reference,
      email,
      amount,
      currency: txSummary.currency,
    });
    if (!paymentRecord) {
      return res.status(200).send("Webhook payment not found");
    }

    if (paymentRecord.status === "completed") {
      return res.status(200).send("Webhook already processed");
    }
    if (paymentRecord.status === "processing") {
      return res.status(200).send("Webhook processing in progress");
    }
    if (paymentRecord.status === "failed") {
      return res.status(200).send("Webhook ignored for failed payment");
    }

    claimedRecord = await claimPaymentForProcessing(paymentRecord._id);
    if (!claimedRecord) {
      return res.status(200).send("Webhook already being processed");
    }

    const referenceMatches = txSummary.reference === claimedRecord.reference;
    const emailMatches = txSummary.customerEmail === claimedRecord.email;
    const amountMatches = txSummary.amount === claimedRecord.amount;
    const currencyMatches = txSummary.currency === normalizeCurrency(claimedRecord.currency);
    if (!referenceMatches || !emailMatches || !amountMatches || !currencyMatches) {
      claimedRecord.status = "failed";
      claimedRecord.failureReason = "webhook_payload_mismatch";
      claimedRecord.gatewayResponse = txSummary;
      await claimedRecord.save();
      return res.status(200).send("Webhook payload mismatch");
    }

    const user = await User.findById(claimedRecord.userId).select(
      "_id email isPremium premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd premiumLastPaymentRef"
    );
    if (!user || normalizeEmail(user.email) !== email) {
      claimedRecord.status = "failed";
      claimedRecord.failureReason = "user_mismatch";
      claimedRecord.gatewayResponse = txSummary;
      await claimedRecord.save();
      return res.status(200).send("Webhook user mismatch");
    }

    applyPremiumActivation(user, { reference });
    await user.save();

    claimedRecord.status = "completed";
    claimedRecord.verifiedAt = new Date();
    claimedRecord.verificationSource = "webhook";
    claimedRecord.failureReason = null;
    claimedRecord.currency = txSummary.currency;
    claimedRecord.channel = txSummary.channel;
    claimedRecord.gatewayTransactionId = txSummary.id;
    const paidAt = txSummary.paidAt ? toSafeDate(txSummary.paidAt) : null;
    claimedRecord.paidAt = paidAt || claimedRecord.paidAt;
    claimedRecord.gatewayResponse = txSummary;
    await claimedRecord.save();

    return res.status(200).send("Webhook processed");
  } catch (err) {
    if (claimedRecord && claimedRecord.status === "processing") {
      claimedRecord.status = "initiated";
      claimedRecord.failureReason = "webhook_retryable_error";
      claimedRecord.gatewayResponse = {
        message: err?.message || "unknown webhook error",
      };
      await claimedRecord.save();
    }
    console.error("Webhook processing error:", err?.message || err);
    return res.status(500).send("Webhook error");
  }
};

export const listPremiumPaymentsForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const statusRaw = String(req.query.status || "all").toLowerCase();
    const sourceRaw = String(req.query.source || "all").toLowerCase();
    const mismatchOnly = req.query.mismatchOnly === "true";
    const parsedLimit = Number.parseInt(String(req.query.limit || "100"), 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 300)
      : 100;
    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const query = {};

    if (statusRaw !== "all") {
      query.status = statusRaw;
    }
    if (sourceRaw !== "all") {
      query.verificationSource = sourceRaw;
    }

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

    const rows = await PremiumPayment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(
        "userId",
        "_id email username isPremium premiumStatus premiumPlan premiumExpiresAt premiumLastPaymentRef"
      )
      .lean();

    const mapped = rows.map((row) => {
      const user = row.userId || null;
      const premiumSnapshot = user ? getPremiumSnapshot(user) : null;
      const mismatchReasons = [];
      if (row.status === "completed" && user && !premiumSnapshot?.isPremium) {
        mismatchReasons.push("completed_payment_but_user_not_premium");
      }
      if (
        row.status !== "completed" &&
        user &&
        user.premiumLastPaymentRef &&
        String(user.premiumLastPaymentRef) === String(row.reference) &&
        premiumSnapshot?.isPremium
      ) {
        mismatchReasons.push("user_premium_from_non_completed_payment");
      }
      if (normalizeCurrency(row.currency) !== PREMIUM_CURRENCY) {
        mismatchReasons.push("unexpected_currency");
      }
      if (row.status === "completed" && !row.gatewayTransactionId) {
        mismatchReasons.push("missing_gateway_transaction_id");
      }
      if (row.status === "processing" && row.verifyAttempts > 3) {
        mismatchReasons.push("stuck_processing");
      }

      return {
        _id: row._id,
        reference: row.reference,
        status: row.status,
        amount: row.amount,
        currency: row.currency || PREMIUM_CURRENCY,
        verificationSource: row.verificationSource || null,
        verifyAttempts: row.verifyAttempts || 0,
        failureReason: row.failureReason || null,
        channel: row.channel || null,
        gatewayTransactionId: row.gatewayTransactionId || null,
        paidAt: row.paidAt || null,
        verifiedAt: row.verifiedAt || null,
        createdAt: row.createdAt,
        user: user
          ? {
              _id: user._id,
              email: user.email,
              username: user.username || null,
              isPremium: Boolean(premiumSnapshot?.isPremium),
              premiumStatus: premiumSnapshot?.premiumStatus || "inactive",
              premiumPlan: user.premiumPlan || null,
              premiumExpiresAt: user.premiumExpiresAt || null,
            }
          : null,
        hasMismatch: mismatchReasons.length > 0,
        mismatchReasons,
      };
    });

    const filteredRows = mismatchOnly
      ? mapped.filter((row) => row.hasMismatch)
      : mapped;
    const summary = {
      total: mapped.length,
      mismatchCount: mapped.filter((row) => row.hasMismatch).length,
      completedCount: mapped.filter((row) => row.status === "completed").length,
      failedCount: mapped.filter((row) => row.status === "failed").length,
      processingCount: mapped.filter((row) => row.status === "processing").length,
      initiatedCount: mapped.filter((row) => row.status === "initiated").length,
    };

    return res.json({
      summary,
      rows: filteredRows,
      message: "Premium payment audit loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Premium payment audit scatter: " + err.message });
  }
};

export const listMyPremiumPayments = async (req, res) => {
  try {
    const statusRaw = String(req.query.status || "all").toLowerCase();
    const parsedLimit = Number.parseInt(String(req.query.limit || "10"), 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 10;
    const parsedPage = Number.parseInt(String(req.query.page || "1"), 10);
    const page = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;
    const skip = (page - 1) * limit;
    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const query = { userId: req.user._id };

    if (statusRaw !== "all") {
      query.status = statusRaw;
    }

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

    const [rows, total, completedCount, failedCount, processingCount, initiatedCount] =
      await Promise.all([
      PremiumPayment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "reference status amount currency verificationSource verifyAttempts failureReason channel gatewayTransactionId paidAt verifiedAt createdAt updatedAt"
        )
        .lean(),
      PremiumPayment.countDocuments(query),
      PremiumPayment.countDocuments({ ...query, status: "completed" }),
      PremiumPayment.countDocuments({ ...query, status: "failed" }),
      PremiumPayment.countDocuments({ ...query, status: "processing" }),
      PremiumPayment.countDocuments({ ...query, status: "initiated" }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const summary = {
      total,
      completedCount,
      failedCount,
      processingCount,
      initiatedCount,
    };

    return res.json({
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
      rows,
      message: "Premium billing history loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Premium billing history scatter: " + err.message });
  }
};

export const getWallet = async (req, res) => {
  try {
    const wallet = await ensureWalletBalanceFields(req.user._id);
    console.log(
      "Fetching wallet for:",
      req.user.email,
      "Balance:",
      wallet?.balance
    );
    if (!wallet) {
      return res.json({
        balance: 0,
        availableBalance: 0,
        heldBalance: 0,
        message: "No wallet yet—start funding!",
      });
    }
    res.json({
      balance: wallet.balance || 0,
      availableBalance: wallet.availableBalance || wallet.balance || 0,
      heldBalance: wallet.heldBalance || 0,
      message: "Wallet dey here!",
    });
  } catch (err) {
    console.error("Wallet Error:", err.message);
    res.status(500).json({ message: "Wallet fetch scatter: " + err.message });
  }
};

export const getTipHistory = async (req, res) => {
  try {
    console.log("Fetching tip history for:", req.user.email);
    const tipsSent = await Transaction.find({
      senderId: req.user._id,
      status: "completed",
      type: "tip", // Filter by tip type
    }).lean();
    const tipsReceived = await Transaction.find({
      receiverId: req.user._id,
      status: "completed",
      type: "tip",
    }).lean();
    const sentPromises = tipsSent.map(async (t) => ({
      amount: t.amount / 100,
      date: t.updatedAt,
      to: (await User.findById(t.receiverId))?.email || "Unknown",
    }));
    const receivedPromises = tipsReceived.map(async (t) => ({
      amount: (t.amount - t.platformCut) / 100,
      date: t.updatedAt,
      from: (await User.findById(t.senderId))?.email || "Unknown",
    }));

    const sent = await Promise.all(sentPromises);
    const received = await Promise.all(receivedPromises);

    res.json({ sent, received, message: "Tip history dey here!" });
  } catch (err) {
    console.error("Tip History Error:", err.message);
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};
