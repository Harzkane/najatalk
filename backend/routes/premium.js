// backend/routes/premium.js
import express from "express";
import {
  initiatePremium,
  verifyPremium,
  completePremium,
  tipUser,
  verifyTip,
} from "../controllers/premium.js";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/user.js";

const router = express.Router();

// Core routes for Paystack
router.post("/initiate", authMiddleware, initiatePremium);
router.post("/verify", authMiddleware, verifyPremium);
router.get("/verify", authMiddleware, verifyPremium); // Add GET for Paystack callback
router.post("/complete", authMiddleware, completePremium);
router.post("/tip", authMiddleware, tipUser);
router.get("/tip-verify", authMiddleware, verifyTip); // For tip callback

// Paystack Webhook (optional, simplified)
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  if (!signature || signature !== process.env.PAYSTACK_WEBHOOK_HASH) {
    console.log("Unauthorized webhook attempt");
    return res.status(403).send("Unauthorized");
  }

  const payload = req.body;
  console.log("Paystack Webhook payload:", payload);

  if (payload.event === "charge.success" && payload.data.status === "success") {
    try {
      const user = await User.findOne({ email: payload.data.customer.email });
      if (user) {
        user.isPremium = true;
        await user.save();
        console.log(`Premium activated for ${user.email} via webhook`);
      } else {
        console.log(`User not found for email: ${payload.data.customer.email}`);
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
    }
  }

  res.status(200).send("Webhook received");
});

export default router;
