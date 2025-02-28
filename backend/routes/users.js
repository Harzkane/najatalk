// backend/routes/users.js
import express from "express";
import {
  banUser,
  getBannedUsers,
  appealBan,
  unbanUser,
  getUserProfile,
} from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/banned", authMiddleware, getBannedUsers);
router.post("/appeal", appealBan);
router.get("/me", authMiddleware, getUserProfile);

router.put("/:userId/ban", authMiddleware, banUser);
router.put("/:userId/unban", authMiddleware, unbanUser);

export default router;
