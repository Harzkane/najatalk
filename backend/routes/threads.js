// backend/routes/threads.js
import express from "express";
import {
  createThread,
  getThreads,
  getThreadById,
  createReply,
  searchThreads,
  listThreadsForAdmin,
  getAdminThreadDetails,
  reportThread,
  getReports,
  dismissReport,
  hasUserReportedThread,
  hasUserReportedReply,
  deleteThread,
  updateThread,
  toggleThreadLike,
  toggleReplyLike,
  toggleThreadBookmark,
  toggleThreadSolved,
  toggleThreadSticky,
  toggleThreadLock,
  reportReply,
} from "../controllers/threads.js";
import { authMiddleware } from "../middleware/auth.js";
import { reportActionLimiter, writeActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/", authMiddleware, writeActionLimiter, createThread);
router.get("/", getThreads);
router.get("/search", searchThreads);
router.get("/reports", authMiddleware, getReports);
router.get("/admin/all", authMiddleware, listThreadsForAdmin);
router.get("/admin/:id", authMiddleware, getAdminThreadDetails);

router.delete("/reports/:id", authMiddleware, dismissReport);
router.post("/replies/:replyId/report", authMiddleware, reportActionLimiter, reportReply);
router.get("/replies/:replyId/hasReported", authMiddleware, hasUserReportedReply);
router.post("/replies/:replyId/like", authMiddleware, toggleReplyLike);

router.get("/:id", getThreadById);
router.put("/:id", authMiddleware, writeActionLimiter, updateThread);
router.delete("/:id", authMiddleware, deleteThread);

router.post("/:id/replies", authMiddleware, writeActionLimiter, createReply);
router.post("/:id/report", authMiddleware, reportActionLimiter, reportThread);
router.get("/:id/hasReported", authMiddleware, hasUserReportedThread);
router.post("/:id/like", authMiddleware, toggleThreadLike);
router.post("/:id/bookmark", authMiddleware, toggleThreadBookmark);
router.post("/:id/solved", authMiddleware, toggleThreadSolved);
router.post("/:id/sticky", authMiddleware, toggleThreadSticky);
router.post("/:id/lock", authMiddleware, toggleThreadLock);

export default router;
