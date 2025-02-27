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

export default router;
