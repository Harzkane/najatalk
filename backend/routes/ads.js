// backend/routes/ads.js
import express from "express";
import {
  getAds,
  listAdsForAdmin,
  createAd,
  trackClick,
  updateAd,
  deleteAd,
  trackImpression,
} from "../controllers/ads.js";
import { authMiddleware } from "../middleware/auth.js";
import { moneyActionLimiter, writeActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.get("/", getAds);
router.get("/admin/review", authMiddleware, listAdsForAdmin);
router.post("/", authMiddleware, moneyActionLimiter, createAd);
router.post("/click/:adId", trackClick);
router.get("/impression/:adId", trackImpression);
router.put("/:adId", authMiddleware, writeActionLimiter, updateAd);
router.delete("/:adId", authMiddleware, writeActionLimiter, deleteAd);

export default router;
