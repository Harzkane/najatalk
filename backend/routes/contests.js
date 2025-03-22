// backend/routes/contests.js
import express from "express";
import { createContest, getContests } from "../controllers/contests.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createContest);
router.get("/", getContests);

export default router;
