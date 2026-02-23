// backend/controllers/ads.js
import Ad from "../models/ad.js";
import User from "../models/user.js";
import { hasPermission } from "../utils/permissions.js";
import Wallet from "../models/wallet.js";
import WalletLedger from "../models/walletLedger.js";
import { logger } from "../utils/logger.js";

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
    logger.info("ads.list.fetch", {
      query,
      count: Array.isArray(ads) ? ads.length : 0,
    });
    res.json({ ads, message: "Ads dey here—check am!" });
  } catch (err) {
    logger.error("ads.list.error", { error: err?.message || err });
    res.status(500).json({ message: "Ads scatter: " + err.message });
  }
};

export const listAdsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only." });
    }

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "pending").trim().toLowerCase();
    const type = String(req.query.type || "all").trim().toLowerCase();
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
    if (status !== "all" && ["pending", "active", "paused", "expired"].includes(status)) {
      query.status = status;
    }
    if (type !== "all" && ["sidebar", "banner", "popup"].includes(type)) {
      query.type = type;
    }
    if (q) {
      query.$or = [
        { brand: { $regex: q, $options: "i" } },
        { text: { $regex: q, $options: "i" } },
        { link: { $regex: q, $options: "i" } },
      ];
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
      if (userMatches.length > 0) {
        query.$or.push({ userId: { $in: userMatches.map((u) => u._id) } });
      }
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

    const [ads, total, statusAgg] = await Promise.all([
      Ad.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("userId", "_id email username role")
        .lean(),
      Ad.countDocuments(query),
      Ad.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 }, budget: { $sum: "$budget" } } },
      ]),
    ]);

    const summary = {
      total,
      pending: 0,
      active: 0,
      paused: 0,
      expired: 0,
      totalBudget: 0,
    };
    for (const row of statusAgg) {
      const key = String(row?._id || "");
      if (key === "pending") summary.pending = Number(row.count || 0);
      if (key === "active") summary.active = Number(row.count || 0);
      if (key === "paused") summary.paused = Number(row.count || 0);
      if (key === "expired") summary.expired = Number(row.count || 0);
      summary.totalBudget += Number(row.budget || 0);
    }

    return res.json({
      ads,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + ads.length < total,
        hasPrev: page > 1,
      },
      message: "Admin ads review loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Ads review scatter: " + err.message });
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

    logger.info("ads.create.success", {
      adId: createdAd?._id?.toString?.() || null,
      userId: req.user?._id?.toString?.() || null,
      budget: Number(createdAd?.budget || 0),
      type: createdAd?.type || null,
    });
    res.status(201).json({ ad: createdAd, message: "Ad submitted—wait for approval!" });
  } catch (err) {
    logger.error("ads.create.error", {
      userId: req.user?._id?.toString?.() || null,
      error: err?.message || err,
    });
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
    const isAdmin = hasPermission(req.user, "platform.admin");
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
    const isAdmin = hasPermission(req.user, "platform.admin");
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
    logger.info("ads.impression.tracked", {
      adId,
      budgetLeft: Number(ad?.budget || 0),
    });
    res.json({ message: "Impression tracked—ad dey shine!" });
  } catch (err) {
    logger.error("ads.impression.error", {
      adId,
      error: err?.message || err,
    });
    res
      .status(500)
      .json({ message: "Impression track scatter: " + err.message });
  }
};
