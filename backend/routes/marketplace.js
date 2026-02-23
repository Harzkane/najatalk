// backend/routes/marketplace.js
import express from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getCategories,
  getPlatformWallet,
  releaseEscrow,
  markOrderShipped,
  buyListing,
  toggleFavoriteListing,
  getFavoriteListings,
  proxyListingImage,
  getMarketplacePolicyForCurrentUser,
  boostListing,
} from "../controllers/marketplace.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";
import { moneyActionLimiter, writeActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/listings", authMiddleware, writeActionLimiter, createListing);
router.get("/listings", optionalAuthMiddleware, getListings);
router.get("/categories", getCategories);
router.get("/image-proxy", proxyListingImage);
router.get("/me/policy", authMiddleware, getMarketplacePolicyForCurrentUser);
router.get("/wallet", authMiddleware, getPlatformWallet);
router.post("/release/:id", authMiddleware, moneyActionLimiter, releaseEscrow);
router.post("/ship/:id", authMiddleware, writeActionLimiter, markOrderShipped);
router.post("/listings/:id/boost", authMiddleware, moneyActionLimiter, boostListing);
router.get("/favorites", authMiddleware, getFavoriteListings);
router.post("/favorites/:id", authMiddleware, writeActionLimiter, toggleFavoriteListing);
router.get("/listings/:id", optionalAuthMiddleware, getListingById);
router.put("/listings/:id", authMiddleware, writeActionLimiter, updateListing);
router.delete("/listings/:id", authMiddleware, writeActionLimiter, deleteListing);
router.post("/buy/:id", authMiddleware, moneyActionLimiter, buyListing);

export default router;
