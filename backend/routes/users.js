// backend/routes/users.js
import express from "express";
import {
  banUser,
  getBannedUsers,
  appealBan,
  unbanUser,
  getUserProfile,
  getProfileCompleteness,
  updateMyProfile,
  getMyWalletLedger,
  downloadMyWalletStatementPdf,
  requestPayout,
  listPayoutsForAdmin,
  getPayoutRollupsForAdmin,
  detectWalletMismatchesForAdmin,
  decidePayout,
  updateUserFlair,
  getUserProfilePublic,
  getSellerWallet,
  sendTip,
  verifyTip,
} from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/banned", authMiddleware, getBannedUsers);
router.post("/appeal", appealBan);
router.get("/me", authMiddleware, getUserProfile);
router.get("/me/profile-completeness", authMiddleware, getProfileCompleteness);
router.get("/me/wallet-ledger", authMiddleware, getMyWalletLedger);
router.get("/me/wallet-statement/pdf", authMiddleware, downloadMyWalletStatementPdf);
router.post("/me/wallet/payouts/request", authMiddleware, requestPayout);
router.get("/admin/payouts", authMiddleware, listPayoutsForAdmin);
router.get("/admin/payouts/rollups", authMiddleware, getPayoutRollupsForAdmin);
router.get("/admin/wallet-mismatches", authMiddleware, detectWalletMismatchesForAdmin);
router.put("/admin/payouts/:payoutId/decide", authMiddleware, decidePayout);
router.patch("/me/profile", authMiddleware, updateMyProfile);
router.post("/flair", authMiddleware, updateUserFlair);
router.get("/:userId", getUserProfilePublic);
router.put("/:userId/ban", authMiddleware, banUser);
router.put("/:userId/unban", authMiddleware, unbanUser);
router.get("/:userId/wallet", authMiddleware, getSellerWallet);
router.post("/tip", authMiddleware, sendTip);
router.post("/verifyTip", authMiddleware, verifyTip);

export default router;
