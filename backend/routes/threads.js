// backend/routes/threads.js
import express from "express";
import {
  createThread,
  getThreads,
  getThreadById,
  createReply,
  searchThreads,
  reportThread,
  getReports,
  dismissReport,
  hasUserReportedThread,
  deleteThread,
  toggleThreadLike,
  toggleThreadBookmark,
  toggleThreadSolved,
  toggleThreadSticky,
  toggleThreadLock,
} from "../controllers/threads.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createThread);
router.get("/", getThreads);
router.get("/search", searchThreads);
router.get("/reports", authMiddleware, getReports);

router.delete("/reports/:id", authMiddleware, dismissReport);

router.get("/:id", getThreadById);
router.delete("/:id", authMiddleware, deleteThread);

router.post("/:id/replies", authMiddleware, createReply);
router.post("/:id/report", authMiddleware, reportThread);
router.get("/:id/hasReported", authMiddleware, hasUserReportedThread);
router.post("/:id/like", authMiddleware, toggleThreadLike);
router.post("/:id/bookmark", authMiddleware, toggleThreadBookmark);
router.post("/:id/solved", authMiddleware, toggleThreadSolved);
router.post("/:id/sticky", authMiddleware, toggleThreadSticky);
router.post("/:id/lock", authMiddleware, toggleThreadLock);

export default router;
