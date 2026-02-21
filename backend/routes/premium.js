// backend/routes/premium.js
import express from "express";
import crypto from "crypto";
import {
  initiatePremium,
  verifyPremium,
  subscribePremiumWithWallet,
  handlePaystackWebhook,
  listPremiumPaymentsForAdmin,
  listMyPremiumPayments,
  getWallet,
  getTipHistory,
} from "../controllers/premium.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Core routes for Paystack
router.post("/initiate", authMiddleware, initiatePremium);
router.post("/verify", authMiddleware, verifyPremium);
router.get("/verify", authMiddleware, verifyPremium);
router.post("/subscribe-with-wallet", authMiddleware, subscribePremiumWithWallet);
router.get("/admin/payments", authMiddleware, listPremiumPaymentsForAdmin);
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
    console.log("Unauthorized webhook attempt");
    return res.status(403).send("Unauthorized");
  }

  next();
});
router.post("/webhook", handlePaystackWebhook);

export default router;
