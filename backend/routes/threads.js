// backend/routes/threads.js
import express from "express";
import {
  createThread,
  getThreads,
  getThreadById,
  createReply,
  searchThreads,
  reportThread,
} from "../controllers/threads.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createThread);
router.get("/", getThreads);
router.get("/search", searchThreads);
router.get("/:id", getThreadById);
router.post("/:id/replies", authMiddleware, createReply);
router.post("/:id/report", authMiddleware, reportThread);

export default router;
