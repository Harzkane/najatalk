// backend/routes/marketplace.js
import express from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getCategories,
  buyListing,
} from "../controllers/marketplace.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/listings", authMiddleware, createListing);
router.get("/listings", getListings);
router.get("/listings/:id", getListingById);
router.put("/listings/:id", authMiddleware, updateListing);
router.delete("/listings/:id", authMiddleware, deleteListing);
router.get("/categories", getCategories);
router.post("/buy/:id", authMiddleware, buyListing);

export default router;
