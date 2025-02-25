// backend/routes/threads.js
import express from "express";
import {
  createThread,
  getThreads,
  getThreadById,
} from "../controllers/threads.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createThread);
router.get("/", getThreads);
router.get("/:id", getThreadById);

export default router;
