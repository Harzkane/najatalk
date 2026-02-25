// backend/routes/auth.js
import express from "express";
import {
  login,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/auth.js";
import { authLoginLimiter, authSignupLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/signup", authSignupLimiter, signup);
router.post("/login", authLoginLimiter, login);
router.post("/resend-verification", authSignupLimiter, resendVerification);
router.post("/forgot-password", authSignupLimiter, requestPasswordReset);
router.post("/reset-password/:token", authSignupLimiter, resetPassword);
router.get("/verify/:token", verifyEmail);

export default router;
