// backend/routes/users.js
import express from "express";
import { banUser } from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.put("/:userId/ban", authMiddleware, banUser);

export default router;
