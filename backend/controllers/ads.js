// backend/controllers/ads.js
import Ad from "../models/ad.js";
import Wallet from "../models/wallet.js";

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
    if (!req.user) return res.status(401).json({ message: "Abeg login!" });
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < budget) {
      console.log("Wallet check failed:", { balance: wallet?.balance, budget });
      return res.status(400).json({ message: "Wallet no reach—fund am!" });
    }

    const minCpc = { sidebar: 5000, banner: 7500, popup: 10000 }; // kobo
    if (cpc < minCpc[type]) {
      return res.status(400).json({
        message: `CPC too low—minimum ₦${minCpc[type] / 100} for ${type}!`,
      });
    }
    if (cpc > budget) {
      return res
        .status(400)
        .json({ message: "CPC no fit pass budget—adjust am!" });
    }

    const ad = new Ad({
      userId: req.user._id,
      brand,
      text,
      link,
      type,
      budget,
      cpc,
      status: "pending",
    });
    await ad.save();
    wallet.balance -= budget;
    await wallet.save();
    console.log("Ad Created:", ad);
    res.status(201).json({ ad, message: "Ad submitted—wait for approval!" });
  } catch (err) {
    console.error("Ad creation error:", err);
    res.status(500).json({ message: "Ad creation scatter: " + err.message });
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
  const { status, startDate } = req.body;
  try {
    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ message: "Ad no dey!" });
    ad.status = status;
    if (startDate) ad.startDate = startDate;
    await ad.save();
    res.json({ message: "Ad updated—sharp!" });
  } catch (err) {
    res.status(500).json({ message: "Ad update scatter: " + err.message });
  }
};

export const deleteAd = async (req, res) => {
  const { adId } = req.params;
  try {
    await Ad.findByIdAndDelete(adId);
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
