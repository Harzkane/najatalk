// backend/routes/ads.js
import express from "express";
import {
  getAds,
  createAd,
  trackClick,
  updateAd,
  deleteAd,
  trackImpression,
} from "../controllers/ads.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAds);
router.post("/", authMiddleware, createAd);
router.post("/click/:adId", trackClick);
router.get("/impression/:adId", trackImpression);
router.put("/:adId", authMiddleware, updateAd);
router.delete("/:adId", authMiddleware, deleteAd);

export default router;
