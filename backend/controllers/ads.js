// backend/controllers/ads.js
import Ad from "../models/ad.js";
import Wallet from "../models/wallet.js";
import WalletLedger from "../models/walletLedger.js";

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

export const getAds = async (req, res) => {
  try {
    const { status, type, userId } = req.query; // Add userId to query
    let query = {};
    if (userId) {
      query.userId = userId; // Filter by userId if provided
      if (status) query.status = status; // Optional status filter
      if (type) query.type = type; // Optional type filter
    } else if (status && type) {
      query = { status, type }; // Original filter for public ads
    } else if (status) {
      query = { status };
    } else {
      query = { status: "active", budget: { $gt: 0 } }; // Default for public
    }
    const ads = await Ad.find(query);
    console.log("Fetched Ads with Query:", query, ads);
    res.json({ ads, message: "Ads dey here—check am!" });
  } catch (err) {
    console.error("Ads fetch error:", err);
    res.status(500).json({ message: "Ads scatter: " + err.message });
  }
};

export const createAd = async (req, res) => {
  const { brand, text, link, type, budget, cpc } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Abeg login!" });
    }

    const minCpc = { sidebar: 5000, banner: 7500, popup: 10000 }; // kobo
    if (cpc < minCpc[type]) {
      throw new Error(`CPC too low—minimum ₦${minCpc[type] / 100} for ${type}!`);
    }
    if (cpc > budget) {
      throw new Error("CPC no fit pass budget—adjust am!");
    }

    await ensureWalletBalanceFields(req.user._id);
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, availableBalance: { $gte: budget } },
      { $inc: { availableBalance: -budget, balance: -budget } },
      { new: true }
    );
    if (!wallet) {
      throw new Error("Wallet no reach—fund am!");
    }

    let createdAd = null;
    try {
      createdAd = await Ad.create({
        userId: req.user._id,
        brand,
        text,
        link,
        type,
        budget,
        cpc,
        status: "pending",
      });
    } catch (adErr) {
      await Wallet.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { availableBalance: budget, balance: budget } }
      );
      throw adErr;
    }

    await WalletLedger.create({
      userId: req.user._id,
      entryKind: "ad_budget_locked",
      amount: budget,
      walletEffect: -budget,
      status: "pending",
      reference: createdAd?._id?.toString() || null,
      availableBalance: wallet.availableBalance || 0,
      heldBalance: wallet.heldBalance || 0,
      balance: wallet.balance || 0,
      metadata: { adType: type, cpc },
    });

    if (!createdAd) {
      return res.status(500).json({ message: "Ad creation scatter: no ad created" });
    }

    console.log("Ad Created:", createdAd);
    res.status(201).json({ ad: createdAd, message: "Ad submitted—wait for approval!" });
  } catch (err) {
    console.error("Ad creation error:", err);
    const message = err.message || "Ad creation scatter";
    const status = message.includes("Wallet") || message.includes("CPC") ? 400 : 500;
    res.status(status).json({ message });
  }
};

export const trackClick = async (req, res) => {
  const { adId } = req.params;
  try {
    const ad = await Ad.findById(adId);
    if (!ad || ad.status !== "active" || ad.budget < ad.cpc) {
      return res
        .status(404)
        .json({ message: "Ad no dey or budget don finish!" });
    }
    ad.clicks += 1;
    ad.budget -= ad.cpc;
    if (ad.budget <= 0) ad.status = "expired";
    ad.updatedAt = new Date();
    await ad.save();
    res.json({ message: "Click tracked—ad dey roll!" });
  } catch (err) {
    res.status(500).json({ message: "Click track scatter: " + err.message });
  }
};

export const updateAd = async (req, res) => {
  const { adId } = req.params;
  const { status, startDate, brand, text, link } = req.body;
  try {
    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ message: "Ad no dey!" });

    const isOwner = ad.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No be your ad—abeg comot!" });
    }

    if (isAdmin) {
      if (status) ad.status = status;
      if (startDate) ad.startDate = startDate;
    } else {
      if (typeof brand === "string" && brand.trim()) ad.brand = brand.trim();
      if (typeof text === "string" && text.trim()) ad.text = text.trim();
      if (typeof link === "string" && link.trim()) ad.link = link.trim();
      if (status || startDate) {
        return res
          .status(403)
          .json({ message: "Only admin fit approve or schedule ads." });
      }
    }

    await ad.save();
    res.json({ message: "Ad updated—sharp!" });
  } catch (err) {
    res.status(500).json({ message: "Ad update scatter: " + err.message });
  }
};

export const deleteAd = async (req, res) => {
  const { adId } = req.params;
  try {
    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ message: "Ad no dey!" });

    const isOwner = ad.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "No be your ad—abeg comot!" });
    }

    await ad.deleteOne();
    res.json({ message: "Ad deleted—clean!" });
  } catch (err) {
    res.status(500).json({ message: "Ad delete scatter: " + err.message });
  }
};

export const trackImpression = async (req, res) => {
  const { adId } = req.params;
  try {
    const ad = await Ad.findById(adId);
    if (!ad || ad.status !== "active" || ad.budget <= 0) {
      return res
        .status(404)
        .json({ message: "Ad no dey or budget don finish!" });
    }
    ad.impressions += 1;
    ad.budget -= 500; // ₦5 in kobo
    if (ad.budget <= 0) ad.status = "expired";
    ad.updatedAt = new Date();
    await ad.save();
    console.log("Impression tracked:", { adId, budgetLeft: ad.budget });
    res.json({ message: "Impression tracked—ad dey shine!" });
  } catch (err) {
    console.error("Impression track error:", err);
    res
      .status(500)
      .json({ message: "Impression track scatter: " + err.message });
  }
};
