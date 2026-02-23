// backend/routes/premium.js
import express from "express";
import crypto from "crypto";
import {
  initiatePremium,
  verifyPremium,
  subscribePremiumWithWallet,
  handlePaystackWebhook,
  listPremiumPaymentsForAdmin,
  getPremiumPaymentDetailsForAdmin,
  listMyPremiumPayments,
  getWallet,
  getTipHistory,
} from "../controllers/premium.js";
import { authMiddleware } from "../middleware/auth.js";
import { moneyActionLimiter } from "../middleware/rateLimit.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Core routes for Paystack
router.post("/initiate", authMiddleware, moneyActionLimiter, initiatePremium);
router.post("/verify", authMiddleware, moneyActionLimiter, verifyPremium);
router.get("/verify", authMiddleware, moneyActionLimiter, verifyPremium);
router.post(
  "/subscribe-with-wallet",
  authMiddleware,
  moneyActionLimiter,
  subscribePremiumWithWallet
);
router.get("/admin/payments", authMiddleware, listPremiumPaymentsForAdmin);
router.get("/admin/payments/:paymentId", authMiddleware, getPremiumPaymentDetailsForAdmin);
router.get("/my-payments", authMiddleware, listMyPremiumPayments);
router.get("/wallet", authMiddleware, getWallet);
router.get("/tip-history", authMiddleware, getTipHistory);

router.post("/webhook", async (req, res, next) => {
  const paystackSecret = process.env.PAYSTACK_SECRET;
  if (!paystackSecret) {
    return res.status(500).send("Missing PAYSTACK_SECRET");
  }

  const signature = req.headers["x-paystack-signature"];
  const payloadToHash = req.rawBody || JSON.stringify(req.body || {});
  const expectedSignature = crypto
    .createHmac("sha512", paystackSecret)
    .update(payloadToHash)
    .digest("hex");

  const provided = String(signature || "");
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const signaturesMatch =
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);

  if (!signature || !signaturesMatch) {
    logger.warn("premium.webhook.unauthorized_signature", {
      hasSignature: Boolean(signature),
      path: req.originalUrl,
      ip: req.ip,
    });
    return res.status(403).send("Unauthorized");
  }

  next();
});
router.post("/webhook", handlePaystackWebhook);

export default router;
