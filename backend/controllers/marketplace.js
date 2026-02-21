// backend/controllers/marketplace.js
import Listing from "../models/listing.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import PlatformWallet from "../models/platformWallet.js";
import WalletLedger from "../models/walletLedger.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  calculateMarketplaceFee,
  getMarketplacePolicy,
} from "../utils/marketplacePolicy.js";

const categories = [
  "Electronics",
  "Fashion",
  "Home",
  "Food",
  "Services",
  "Others",
];

const sanitizeImageUrls = (imageUrls = []) => {
  if (!Array.isArray(imageUrls)) return [];
  return imageUrls
    .filter((url) => typeof url === "string")
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .slice(0, 8);
};

const sanitizeDeliveryField = (value, maxLength = 120) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const normalizeOrderDetails = (input = {}) => {
  const details = {
    fullName: sanitizeDeliveryField(input.fullName, 80),
    phone: sanitizeDeliveryField(input.phone, 30),
    addressLine1: sanitizeDeliveryField(input.addressLine1, 160),
    addressLine2: sanitizeDeliveryField(input.addressLine2, 160),
    city: sanitizeDeliveryField(input.city, 80),
    state: sanitizeDeliveryField(input.state, 80),
    postalCode: sanitizeDeliveryField(input.postalCode, 20),
    deliveryNote: sanitizeDeliveryField(input.deliveryNote, 280),
  };

  const missingRequired = [];
  if (!details.fullName) missingRequired.push("fullName");
  if (!details.phone) missingRequired.push("phone");
  if (!details.addressLine1) missingRequired.push("addressLine1");
  if (!details.city) missingRequired.push("city");
  if (!details.state) missingRequired.push("state");

  return { details, missingRequired };
};

const formatNairaFromKobo = (kobo = 0) =>
  `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const normalizeHttpUrl = (value = "") => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const getWalletSnapshot = (wallet) => ({
  availableBalance: Number(wallet?.availableBalance || 0),
  heldBalance: Number(wallet?.heldBalance || 0),
  balance: Number(
    wallet?.balance || Number(wallet?.availableBalance || 0) + Number(wallet?.heldBalance || 0)
  ),
});

const createWalletLedgerEntry = async ({
  userId,
  entryKind,
  amount,
  walletEffect,
  status = "completed",
  reference = null,
  counterparty = null,
  listingTitle = null,
  wallet = null,
  transactionId = null,
  listingId = null,
  metadata = {},
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
    listingTitle,
    availableBalance: snapshot.availableBalance,
    heldBalance: snapshot.heldBalance,
    balance: snapshot.balance,
    transactionId,
    listingId,
    metadata,
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
  const total = Number(wallet.availableBalance || 0) + Number(wallet.heldBalance || 0);
  if (Number(wallet.balance || 0) !== total) {
    wallet.balance = total;
    changed = true;
  }
  if (changed) {
    await wallet.save();
  }
  return wallet;
};

const sanitizeListingForViewer = (listingObj, viewer) => {
  if (!listingObj) return listingObj;

  const viewerId = viewer?._id?.toString?.() || null;
  const sellerId =
    typeof listingObj.userId === "string"
      ? listingObj.userId
      : listingObj.userId?._id?.toString?.() || listingObj.userId?.toString?.() || null;
  const buyerId =
    typeof listingObj.buyerId === "string"
      ? listingObj.buyerId
      : listingObj.buyerId?._id?.toString?.() || listingObj.buyerId?.toString?.() || null;
  const isAdmin = viewer?.role === "admin";
  const isSeller = Boolean(viewerId && sellerId && viewerId === sellerId);
  const isBuyer = Boolean(viewerId && buyerId && viewerId === buyerId);

  const sanitized = { ...listingObj };

  if (!(isSeller || isBuyer || isAdmin)) {
    sanitized.orderDetails = null;
    sanitized.buyerConfirmedAt = null;
    sanitized.shippedAt = null;
    sanitized.transactionId = null;
  }

  if (!(isSeller || isAdmin)) {
    sanitized.boostExpiresAt = null;
  }

  return sanitized;
};

const buildSellerStatsMap = async (userIds = []) => {
  if (!userIds.length) return new Map();

  const normalizedIds = userIds
    .filter(Boolean)
    .map((id) => id.toString())
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (!normalizedIds.length) return new Map();

  const uniqueIds = [...new Set(normalizedIds)].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const [activeListingsAgg, completedDealsAgg, responseTimeAgg] =
    await Promise.all([
      Listing.aggregate([
        {
          $match: {
            userId: { $in: uniqueIds },
            status: "active",
          },
        },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            receiverId: { $in: uniqueIds },
            type: "escrow",
            status: "completed",
          },
        },
        { $group: { _id: "$receiverId", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            receiverId: { $in: uniqueIds },
            type: "escrow",
            status: "completed",
          },
        },
        {
          $project: {
            receiverId: 1,
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
            receiverId: 1,
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
        {
          $group: {
            _id: "$receiverId",
            avgResponseHours: { $avg: "$responseHours" },
          },
        },
      ]),
    ]);

  const activeMap = new Map(activeListingsAgg.map((x) => [x._id.toString(), x.count]));
  const dealsMap = new Map(completedDealsAgg.map((x) => [x._id.toString(), x.count]));
  const responseMap = new Map(
    responseTimeAgg
      .filter((x) => x?._id)
      .map((x) => {
        const avg =
          typeof x.avgResponseHours === "number" && Number.isFinite(x.avgResponseHours)
            ? Number(x.avgResponseHours.toFixed(1))
            : null;
        return [x._id.toString(), avg];
      })
  );

  const statsMap = new Map();
  uniqueIds.forEach((id) => {
    const key = id.toString();
    const completedDeals = dealsMap.get(key) || 0;
    const activeListings = activeMap.get(key) || 0;
    const avgResponseHours = responseMap.get(key) ?? null;
    statsMap.set(key, {
      completedDeals,
      activeListings,
      avgResponseHours,
      trustTier:
        completedDeals >= 10
          ? "Top Seller"
          : completedDeals >= 3
          ? "Trusted Seller"
          : "New Seller",
    });
  });

  return statsMap;
};

export const createListing = async (req, res) => {
  const { title, description, price, category, imageUrls } = req.body;
  try {
    if (!title || !description || !price) {
      return res.status(400).json({ message: "Abeg, fill all fields!" });
    }
    const policy = getMarketplacePolicy(req.user);
    const activeListingCount = await Listing.countDocuments({
      userId: req.user._id,
      status: { $in: ["active", "pending"] },
    });
    if (activeListingCount >= policy.activeListingLimit) {
      return res.status(403).json({
        message: `Tier limit reached. You can only keep ${policy.activeListingLimit} active listings on ${policy.tier} tier.`,
        limit: policy.activeListingLimit,
        activeListingCount,
        tier: policy.tier,
        upgradeSuggested: policy.tier === "free",
      });
    }

    const listing = new Listing({
      title,
      description,
      price: price * 100,
      userId: req.user._id,
      category: category || "Others",
      imageUrls: sanitizeImageUrls(imageUrls),
    });
    await listing.save();
    res.status(201).json({ message: "Item posted—market dey hot!", listing });
  } catch (err) {
    res.status(500).json({ message: "Listing scatter: " + err.message });
  }
};

export const getListings = async (req, res) => {
  try {
    const { includeSold } = req.query;
    const query =
      includeSold === "true"
        ? { status: { $ne: "deleted" } }
        : { status: { $in: ["active", "pending"] } };
    const listings = await Listing.find(query)
      .populate("userId", "email flair username avatarUrl")
      .sort({ createdAt: -1 });
    const now = Date.now();
    const sortedListings = listings.sort((a, b) => {
      const aBoostExpiry = a.boostExpiresAt ? new Date(a.boostExpiresAt).getTime() : 0;
      const bBoostExpiry = b.boostExpiresAt ? new Date(b.boostExpiresAt).getTime() : 0;
      const aBoosted = Number.isFinite(aBoostExpiry) && aBoostExpiry > now;
      const bBoosted = Number.isFinite(bBoostExpiry) && bBoostExpiry > now;
      if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
      if (aBoosted && bBoosted && aBoostExpiry !== bBoostExpiry) return bBoostExpiry - aBoostExpiry;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const sellerStatsMap = await buildSellerStatsMap(
      sortedListings.map((listing) => listing.userId?._id).filter(Boolean)
    );
    const listingsWithStats = sortedListings.map((listing) => {
      const listingObj = {
        ...listing.toObject(),
        sellerStats: sellerStatsMap.get(listing.userId?._id?.toString()) || {
          completedDeals: 0,
          activeListings: 0,
          avgResponseHours: null,
          trustTier: "New Seller",
        },
      };
      return sanitizeListingForViewer(listingObj, req.user);
    });
    res.json({ listings: listingsWithStats, message: "Market items dey here—check am!" });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const getListingById = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id).populate(
      "userId",
      "email flair username avatarUrl"
    );
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }
    const sellerStatsMap = await buildSellerStatsMap([listing.userId?._id]);
    const sellerStats = sellerStatsMap.get(listing.userId?._id?.toString()) || {
      completedDeals: 0,
      activeListings: 0,
      avgResponseHours: null,
      trustTier: "New Seller",
    };
    const listingObj = sanitizeListingForViewer(
      { ...listing.toObject(), sellerStats },
      req.user
    );
    res.json({
      listing: listingObj,
      message: "Item found—check am out!",
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const updateListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, imageUrls } = req.body;
  try {
    const listing = await Listing.findById(id);
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No be your item—abeg comot!" });
    }
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price ? price * 100 : listing.price;
    listing.category = category || listing.category;
    if (Array.isArray(imageUrls)) {
      listing.imageUrls = sanitizeImageUrls(imageUrls);
    }
    await listing.save();
    res.json({ message: "Item updated—market still dey hot!", listing });
  } catch (err) {
    res.status(500).json({ message: "Update scatter: " + err.message });
  }
};

export const deleteListing = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id);
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }
    if (
      listing.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "No be your item—abeg comot!" });
    }
    listing.status = "deleted";
    await listing.save();
    res.json({ message: "Item don waka—deleted!" });
  } catch (err) {
    res.status(500).json({ message: "Delete scatter: " + err.message });
  }
};

export const getCategories = (req, res) => {
  try {
    res.json({ categories, message: "Categories dey here—pick one!" });
  } catch (err) {
    res.status(500).json({ message: "Categories scatter: " + err.message });
  }
};

export const proxyListingImage = async (req, res) => {
  const source = normalizeHttpUrl(req.query.url);
  if (!source) {
    return res.status(400).json({ message: "Invalid image url." });
  }

  try {
    const response = await fetch(source, { redirect: "follow" });
    if (!response.ok) {
      return res.status(502).json({ message: "Upstream image fetch failed." });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(415).json({ message: "URL did not return an image." });
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(bytes);
  } catch (err) {
    return res.status(500).json({ message: "Image proxy scatter: " + err.message });
  }
};

export const buyListing = async (req, res) => {
  const { id } = req.params;
  const { orderDetails = {} } = req.body || {};
  try {
    console.log("Buy Attempt:", { id, user: req.user._id });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID—check am!" });
    }

    const listing = await Listing.findOne({ _id: id, status: "active" });
    console.log("Listing:", listing);
    if (!listing) {
      return res.status(400).json({ message: "Item no dey or e don waka!" });
    }
    if (listing.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You no fit buy your own item!" });
    }
    const { details, missingRequired } = normalizeOrderDetails(orderDetails);
    if (missingRequired.length > 0) {
      return res.status(400).json({
        message: "Delivery details incomplete.",
        missingRequired,
      });
    }

    await ensureWalletBalanceFields(req.user._id);
    const buyerWallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, availableBalance: { $gte: listing.price } },
      { $inc: { availableBalance: -listing.price, heldBalance: listing.price } },
      { new: true }
    );
    console.log("Wallet:", buyerWallet);
    if (!buyerWallet) {
      return res.status(400).json({ message: "Oga, your wallet no reach!" });
    }

    const transaction = await Transaction.create({
      senderId: req.user._id,
      receiverId: listing.userId,
      amount: listing.price,
      type: "escrow",
      status: "pending",
      reference: uuidv4(),
      listingId: listing._id,
    });
    console.log("Transaction:", transaction);

    const updatedListing = await Listing.findOneAndUpdate(
      { _id: listing._id, status: "active" },
      {
        $set: {
          status: "pending",
          fulfillmentStatus: "awaiting_seller",
          buyerId: req.user._id,
          transactionId: transaction._id,
          orderDetails: details,
          shippedAt: null,
          buyerConfirmedAt: null,
        },
      },
      { new: true }
    );

    if (!updatedListing) {
      await Transaction.deleteOne({ _id: transaction._id });
      await Wallet.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { availableBalance: listing.price, heldBalance: -listing.price } }
      );
      return res.status(400).json({ message: "Item no dey or e don waka!" });
    }

    await createWalletLedgerEntry({
      userId: req.user._id,
      entryKind: "escrow_hold",
      amount: listing.price,
      walletEffect: 0,
      status: "pending",
      reference: transaction.reference,
      counterparty: updatedListing.userId?.toString() || null,
      listingTitle: updatedListing.title,
      wallet: buyerWallet,
      transactionId: transaction._id,
      listingId: updatedListing._id,
    });

    res.json({
      message:
        "Item dey hold—escrow don start! Seller go process shipment and you fit confirm on delivery.",
      listing: updatedListing,
    });
  } catch (err) {
    console.error("Buy Error:", err);
    const status = err.message?.includes("no reach") || err.message?.includes("fit buy") || err.message?.includes("no dey") ? 400 : 500;
    res.status(status).json({ message: err.message || "Buy scatter" });
  }
};

export const markOrderShipped = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID—check am!" });
    }

    const listing = await Listing.findById(id);
    if (!listing || listing.status !== "pending") {
      return res.status(404).json({ message: "Pending order no dey for this listing." });
    }
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only seller fit mark order as shipped." });
    }
    if (!listing.buyerId) {
      return res.status(400).json({ message: "Order no get buyer yet." });
    }
    if (listing.fulfillmentStatus === "shipped") {
      return res.json({ message: "Order already marked shipped.", listing });
    }

    listing.fulfillmentStatus = "shipped";
    listing.shippedAt = new Date();
    await listing.save();

    return res.json({
      message: "Order marked as shipped. Buyer can now confirm delivery.",
      listing,
    });
  } catch (err) {
    return res.status(500).json({ message: "Ship status scatter: " + err.message });
  }
};

export const releaseEscrow = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Release Attempt:", { id, user: req.user._id });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid listing ID—check am well!" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      throw new Error("Listing no dey—where e waka go?");
    }
    console.log("Listing:", listing);

    if (listing.status !== "pending") {
      throw new Error("Item no dey for escrow—e don waka!");
    }
    if (!listing.buyerId || listing.buyerId.toString() !== req.user._id.toString()) {
      throw new Error("Only buyer fit confirm delivery.");
    }
    if (listing.fulfillmentStatus !== "shipped") {
      throw new Error("Seller never mark order as shipped yet.");
    }

    const transaction = await Transaction.findById(listing.transactionId);
    console.log("Transaction:", transaction);
    if (!transaction || transaction.status !== "pending") {
      throw new Error("Transaction no dey or e don finish!");
    }
    if (
      transaction.senderId.toString() !== req.user._id.toString() ||
      transaction.receiverId.toString() !== listing.userId.toString()
    ) {
      throw new Error("Transaction parties mismatch.");
    }

    const sellerUser = await User.findById(listing.userId).select(
      "_id isPremium premiumStatus premiumExpiresAt"
    );
    const {
      policy: sellerPolicy,
      feeKobo: platformCut,
      sellerNetKobo: sellerAmount,
    } = calculateMarketplaceFee(listing.price, sellerUser);
    console.log("Funds Split:", {
      platformCut,
      sellerAmount,
      sellerTier: sellerPolicy.tier,
      commissionBps: sellerPolicy.commissionBps,
    });

    await Promise.all([
      ensureWalletBalanceFields(listing.buyerId),
      ensureWalletBalanceFields(listing.userId),
    ]);
    const buyerWallet = await Wallet.findOneAndUpdate(
      { userId: listing.buyerId, heldBalance: { $gte: listing.price } },
      { $inc: { heldBalance: -listing.price, balance: -listing.price } },
      { new: true }
    );
    const settledBuyerWallet =
      buyerWallet ||
      (await Wallet.findOneAndUpdate(
        { userId: listing.buyerId, availableBalance: { $gte: listing.price } },
        { $inc: { availableBalance: -listing.price, balance: -listing.price } },
        { new: true }
      ));
    if (!settledBuyerWallet) {
      throw new Error("Escrow hold no dey for buyer wallet.");
    }

    const sellerWallet = await Wallet.findOneAndUpdate(
      { userId: listing.userId },
      {
        $inc: { availableBalance: sellerAmount, balance: sellerAmount },
        $setOnInsert: { heldBalance: 0 },
      },
      { new: true, upsert: true }
    );
    console.log("Seller Wallet Updated:", sellerWallet);

    let platformWallet = await PlatformWallet.findOne();
    if (!platformWallet) {
      platformWallet = new PlatformWallet({ balance: 0 });
    }
    platformWallet.balance += platformCut;
    platformWallet.lastUpdated = Date.now();
    await platformWallet.save();
    console.log("Platform Wallet Updated:", platformWallet);

    transaction.status = "completed";
    transaction.platformCut = platformCut;
    transaction.marketplaceFeeBps = sellerPolicy.commissionBps;
    transaction.listingId = listing._id;
    await transaction.save();
    console.log("Transaction Updated:", transaction);

    listing.status = "sold";
    listing.fulfillmentStatus = "delivered";
    listing.buyerConfirmedAt = new Date();
    await listing.save();
    console.log("Listing Updated:", listing);

    await Promise.all([
      createWalletLedgerEntry({
        userId: listing.buyerId,
        entryKind: "escrow_release",
        amount: listing.price,
        walletEffect: -listing.price,
        status: "completed",
        reference: transaction.reference,
        counterparty: listing.userId.toString(),
        listingTitle: listing.title,
        wallet: settledBuyerWallet,
        transactionId: transaction._id,
        listingId: listing._id,
      }),
      createWalletLedgerEntry({
        userId: listing.userId,
        entryKind: "escrow_sale_credit",
        amount: listing.price,
        walletEffect: sellerAmount,
        status: "completed",
        reference: transaction.reference,
        counterparty: listing.buyerId.toString(),
        listingTitle: listing.title,
        wallet: sellerWallet,
        transactionId: transaction._id,
        listingId: listing._id,
        metadata: {
          marketplaceFeeKobo: platformCut,
          marketplaceFeeBps: sellerPolicy.commissionBps,
          grossAmountKobo: listing.price,
          sellerNetKobo: sellerAmount,
        },
      }),
    ]);

    res.json({ message: "Delivery confirmed—funds don land!", listing });
  } catch (err) {
    console.error("Release Error:", err);
    const status = err.message?.includes("Only buyer")
      ? 403
      : err.message?.includes("no dey") ||
          err.message?.includes("mismatch") ||
          err.message?.includes("waka")
        ? 400
        : 500;
    res.status(status).json({ message: err.message || "Release scatter" });
  }
};

export const getMarketplacePolicyForCurrentUser = async (req, res) => {
  try {
    const policy = getMarketplacePolicy(req.user);
    const activeListingCount = await Listing.countDocuments({
      userId: req.user._id,
      status: { $in: ["active", "pending"] },
    });

    res.json({
      tier: policy.tier,
      activeListingLimit: policy.activeListingLimit,
      activeListingCount,
      remainingListings: Math.max(0, policy.activeListingLimit - activeListingCount),
      commissionBps: policy.commissionBps,
      commissionPercent: Number((policy.commissionBps / 100).toFixed(2)),
      boostCostKobo: policy.boostCostKobo,
      boostCostLabel: formatNairaFromKobo(policy.boostCostKobo),
      boostHours: policy.boostHours,
      message: "Marketplace policy fetched.",
    });
  } catch (err) {
    res.status(500).json({ message: "Policy fetch scatter: " + err.message });
  }
};

export const boostListing = async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await Listing.findById(id);
    if (!listing || listing.status !== "active") {
      return res.status(404).json({ message: "Active listing no dey for boost." });
    }
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only listing owner fit boost this post." });
    }

    const policy = getMarketplacePolicy(req.user);
    await ensureWalletBalanceFields(req.user._id);
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, availableBalance: { $gte: policy.boostCostKobo } },
      { $inc: { availableBalance: -policy.boostCostKobo, balance: -policy.boostCostKobo } },
      { new: true }
    );
    if (!wallet) {
      return res.status(400).json({
        message: `Insufficient wallet balance for boost (${formatNairaFromKobo(
          policy.boostCostKobo
        )}).`,
      });
    }

    const now = new Date();
    const base = listing.boostExpiresAt && listing.boostExpiresAt > now ? listing.boostExpiresAt : now;
    const nextBoostExpiry = new Date(base.getTime() + policy.boostDurationMs);
    listing.boostExpiresAt = nextBoostExpiry;
    listing.lastBoostedAt = now;
    listing.boostLevel = Number(listing.boostLevel || 0) + 1;
    listing.boostsPurchased = Number(listing.boostsPurchased || 0) + 1;
    await listing.save();

    await createWalletLedgerEntry({
      userId: req.user._id,
      entryKind: "marketplace_boost",
      amount: policy.boostCostKobo,
      walletEffect: -policy.boostCostKobo,
      status: "completed",
      reference: `boost_${listing._id}_${Date.now()}`,
      listingTitle: listing.title,
      wallet,
      listingId: listing._id,
      metadata: {
        tier: policy.tier,
        boostHours: policy.boostHours,
      },
    });

    res.json({
      message: `Listing boosted for ${policy.boostHours}h.`,
      listing,
      boost: {
        tier: policy.tier,
        costKobo: policy.boostCostKobo,
        costLabel: formatNairaFromKobo(policy.boostCostKobo),
        expiresAt: nextBoostExpiry,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Boost scatter: " + err.message });
  }
};

export const getPlatformWallet = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const platformWallet = await PlatformWallet.findOne();
    if (!platformWallet) {
      return res
        .status(200)
        .json({ balance: 0, message: "Wallet empty—start dey hustle!" });
    }

    const transactions = await Transaction.find({
      status: "completed",
      platformCut: { $gt: 0 },
    })
      .sort({ createdAt: -1 })
      .populate("listingId", "title")
      .select("type status reference platformCut createdAt updatedAt listingId");

    const entries = transactions.map((t) => ({
      _id: t._id,
      type: t.type,
      status: t.status,
      reference: t.reference || null,
      entryKind: "platform_fee",
      walletEffect: t.platformCut,
      amount: t.platformCut,
      listingTitle: t.listingId?.title || null,
      date: t.updatedAt || t.createdAt,
    }));

    const summary = entries.reduce(
      (acc, entry) => {
        acc.totalCredits += entry.walletEffect;
        return acc;
      },
      { totalCredits: 0, totalDebits: 0 }
    );

    res.json({
      balance: platformWallet.balance,
      lastUpdated: platformWallet.lastUpdated,
      summary,
      entries,
      transactions: transactions.map((t) => ({
        amount: t.platformCut,
        listingTitle: t.listingId?.title || "Unknown Listing",
        date: t.updatedAt || t.createdAt,
      })),
      message: "Platform wallet dey here—check am!",
    });
  } catch (err) {
    console.error("Wallet Error:", err);
    res.status(500).json({ message: "Wallet fetch scatter: " + err.message });
  }
};

export const toggleFavoriteListing = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing ID—check am!" });
    }

    const listing = await Listing.findById(id).select("_id status");
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Item no dey o!" });
    }

    const user = await User.findById(req.user._id).select("savedListings");
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const exists = user.savedListings.some(
      (listingId) => listingId.toString() === id
    );

    if (exists) {
      user.savedListings = user.savedListings.filter(
        (listingId) => listingId.toString() !== id
      );
    } else {
      user.savedListings.push(listing._id);
    }

    await user.save();
    res.json({
      favorited: !exists,
      savedListings: user.savedListings,
      message: exists ? "Removed from saved listings." : "Listing saved.",
    });
  } catch (err) {
    res.status(500).json({ message: "Favorite scatter: " + err.message });
  }
};

export const getFavoriteListings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("savedListings");
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const listings = await Listing.find({
      _id: { $in: user.savedListings },
      status: { $ne: "deleted" },
    })
      .populate("userId", "email flair username avatarUrl")
      .sort({ updatedAt: -1 });

    const sellerStatsMap = await buildSellerStatsMap(
      listings.map((listing) => listing.userId?._id).filter(Boolean)
    );
    const listingsWithStats = listings.map((listing) => ({
      ...listing.toObject(),
      sellerStats: sellerStatsMap.get(listing.userId?._id?.toString()) || {
        completedDeals: 0,
        activeListings: 0,
        avgResponseHours: null,
        trustTier: "New Seller",
      },
    }));

    res.json({
      listings: listingsWithStats,
      savedListingIds: user.savedListings,
      message: "Saved listings loaded.",
    });
  } catch (err) {
    res.status(500).json({ message: "Saved listings scatter: " + err.message });
  }
};
