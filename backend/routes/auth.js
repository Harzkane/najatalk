// backend/routes/auth.js
import express from "express";
import { signup, login, verifyEmail } from "../controllers/auth.js";
import { authLoginLimiter, authSignupLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/signup", authSignupLimiter, signup);
router.post("/login", authLoginLimiter, login);
router.get("/verify/:token", verifyEmail);

export default router;
