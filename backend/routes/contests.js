// backend/routes/contests.js
import express from "express";
import {
  createContest,
  getContests,
  getContestById,
  listContestsForAdmin,
  getContestDetailsForAdmin,
  listContestRiskSignalsForAdmin,
  updateContestByAdmin,
  createContestSubmission,
  voteContestSubmission,
  reviewContestSubmissionByAdmin,
  listMyContestEligibleThreads,
  listMyContestEligibleListings,
  requestContestPrizeClaim,
  reviewContestPrizeClaimByAdmin,
} from "../controllers/contests.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";
import {
  adminMutationLimiter,
  contestActionLimiter,
  moneyActionLimiter,
} from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/admin", authMiddleware, adminMutationLimiter, createContest);
router.get("/admin/list", authMiddleware, listContestsForAdmin);
router.get("/admin/risk-signals", authMiddleware, listContestRiskSignalsForAdmin);
router.get("/admin/:contestId", authMiddleware, getContestDetailsForAdmin);
router.put("/admin/:contestId", authMiddleware, adminMutationLimiter, updateContestByAdmin);
router.put(
  "/admin/:contestId/submissions/:submissionId/review",
  authMiddleware,
  adminMutationLimiter,
  reviewContestSubmissionByAdmin
);
router.put(
  "/admin/submissions/:submissionId/claim-review",
  authMiddleware,
  adminMutationLimiter,
  reviewContestPrizeClaimByAdmin
);
router.get("/me/threads", authMiddleware, listMyContestEligibleThreads);
router.get("/me/listings", authMiddleware, listMyContestEligibleListings);
router.get("/", getContests);
router.get("/:contestId", optionalAuthMiddleware, getContestById);
router.post(
  "/:contestId/submissions",
  authMiddleware,
  contestActionLimiter,
  createContestSubmission
);
router.post(
  "/submissions/:submissionId/claim-prize",
  authMiddleware,
  moneyActionLimiter,
  requestContestPrizeClaim
);
router.post(
  "/submissions/:submissionId/vote",
  authMiddleware,
  contestActionLimiter,
  voteContestSubmission
);

export default router;
