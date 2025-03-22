// backend/routes/users.js
import express from "express";
import {
  banUser,
  getBannedUsers,
  appealBan,
  unbanUser,
  getUserProfile,
  setFlair,
  getUserProfilePublic,
  getSellerWallet,
} from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/banned", authMiddleware, getBannedUsers);
router.post("/appeal", appealBan);
router.get("/me", authMiddleware, getUserProfile);
router.post("/flair", authMiddleware, setFlair);
router.get("/:userId", getUserProfilePublic); // Public route—no auth needed
router.put("/:userId/ban", authMiddleware, banUser);
router.put("/:userId/unban", authMiddleware, unbanUser);
router.get("/:userId/wallet", authMiddleware, getSellerWallet);

export default router;
