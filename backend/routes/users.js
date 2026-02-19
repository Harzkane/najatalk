// backend/routes/users.js
import express from "express";
import {
  banUser,
  getBannedUsers,
  appealBan,
  unbanUser,
  getUserProfile,
  updateUserFlair,
  getUserProfilePublic,
  getSellerWallet,
  sendTip,
  verifyTip,
  hasTipped,
} from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/banned", authMiddleware, getBannedUsers);
router.post("/appeal", appealBan);
router.get("/me", authMiddleware, getUserProfile);
router.post("/flair", authMiddleware, updateUserFlair);
router.post("/verifyTip", authMiddleware, verifyTip);
router.post("/tip", authMiddleware, sendTip);
router.get("/hasTipped", authMiddleware, hasTipped);
router.get("/:userId", getUserProfilePublic);
router.put("/:userId/ban", authMiddleware, banUser);
router.put("/:userId/unban", authMiddleware, unbanUser);
router.get("/:userId/wallet", authMiddleware, getSellerWallet);

export default router;
