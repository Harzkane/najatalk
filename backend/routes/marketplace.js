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

const router = express.Router();

router.post("/listings", authMiddleware, createListing);
router.get("/listings", optionalAuthMiddleware, getListings);
router.get("/categories", getCategories);
router.get("/image-proxy", proxyListingImage);
router.get("/me/policy", authMiddleware, getMarketplacePolicyForCurrentUser);
router.get("/wallet", authMiddleware, getPlatformWallet);
router.post("/release/:id", authMiddleware, releaseEscrow);
router.post("/ship/:id", authMiddleware, markOrderShipped);
router.post("/listings/:id/boost", authMiddleware, boostListing);
router.get("/favorites", authMiddleware, getFavoriteListings);
router.post("/favorites/:id", authMiddleware, toggleFavoriteListing);
router.get("/listings/:id", optionalAuthMiddleware, getListingById);
router.put("/listings/:id", authMiddleware, updateListing);
router.delete("/listings/:id", authMiddleware, deleteListing);
router.post("/buy/:id", authMiddleware, buyListing);

export default router;
