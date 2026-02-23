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
  getAdminPayoutDetails,
  getPayoutRollupsForAdmin,
  getPayoutRollupBucketDetails,
  getPlatformWalletOverviewForAdmin,
  listPlatformWalletEntriesForAdmin,
  getPlatformWalletEntryDetailsForAdmin,
  detectWalletMismatchesForAdmin,
  getWalletMismatchDetailsForAdmin,
  listUserRiskSignalsForAdmin,
  dispatchSlaAlertsForAdmin,
  decidePayout,
  listUsersForAdmin,
  listAdminActions,
  getAdminUserDetails,
  updateUserRole,
  suspendUserByAdmin,
  unsuspendUserByAdmin,
  updateUserFlair,
  getUserProfilePublic,
  getSellerWallet,
  sendTip,
  verifyTip,
  hasTipped,
} from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMutationLimiter, moneyActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.get("/banned", authMiddleware, getBannedUsers);
router.post("/appeal", appealBan);
router.get("/me", authMiddleware, getUserProfile);
router.get("/me/profile-completeness", authMiddleware, getProfileCompleteness);
router.get("/me/wallet-ledger", authMiddleware, getMyWalletLedger);
router.get("/me/wallet-statement/pdf", authMiddleware, downloadMyWalletStatementPdf);
router.post("/me/wallet/payouts/request", authMiddleware, moneyActionLimiter, requestPayout);
router.get("/admin/payouts", authMiddleware, listPayoutsForAdmin);
router.get("/admin/payouts/rollups", authMiddleware, getPayoutRollupsForAdmin);
router.get("/admin/payouts/rollups/:bucket", authMiddleware, getPayoutRollupBucketDetails);
router.get("/admin/payouts/:payoutId", authMiddleware, getAdminPayoutDetails);
router.get("/admin/platform-wallet/overview", authMiddleware, getPlatformWalletOverviewForAdmin);
router.get("/admin/platform-wallet/entries", authMiddleware, listPlatformWalletEntriesForAdmin);
router.post(
  "/admin/sla-alerts/dispatch",
  authMiddleware,
  adminMutationLimiter,
  dispatchSlaAlertsForAdmin
);
router.get(
  "/admin/platform-wallet/entries/:entryId",
  authMiddleware,
  getPlatformWalletEntryDetailsForAdmin
);
router.get("/admin/wallet-mismatches", authMiddleware, detectWalletMismatchesForAdmin);
router.get("/admin/risk-signals", authMiddleware, listUserRiskSignalsForAdmin);
router.get(
  "/admin/wallet-mismatches/:userId/details",
  authMiddleware,
  getWalletMismatchDetailsForAdmin
);
router.get("/admin/users", authMiddleware, listUsersForAdmin);
router.get("/admin/actions", authMiddleware, listAdminActions);
router.get("/admin/users/:userId", authMiddleware, getAdminUserDetails);
router.put("/admin/payouts/:payoutId/decide", authMiddleware, adminMutationLimiter, decidePayout);
router.put("/admin/users/:userId/role", authMiddleware, adminMutationLimiter, updateUserRole);
router.put(
  "/admin/users/:userId/suspend",
  authMiddleware,
  adminMutationLimiter,
  suspendUserByAdmin
);
router.put(
  "/admin/users/:userId/unsuspend",
  authMiddleware,
  adminMutationLimiter,
  unsuspendUserByAdmin
);
router.patch("/me/profile", authMiddleware, updateMyProfile);
router.post("/flair", authMiddleware, updateUserFlair);
router.post("/verifyTip", authMiddleware, moneyActionLimiter, verifyTip);
router.post("/tip", authMiddleware, moneyActionLimiter, sendTip);
router.get("/hasTipped", authMiddleware, hasTipped);
router.get("/:userId", getUserProfilePublic);
router.put("/:userId/ban", authMiddleware, adminMutationLimiter, banUser);
router.put("/:userId/unban", authMiddleware, adminMutationLimiter, unbanUser);
router.get("/:userId/wallet", authMiddleware, getSellerWallet);

export default router;
