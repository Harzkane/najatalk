import mongoose from "mongoose";

const premiumPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["initiated", "processing", "completed", "failed"],
      default: "initiated",
      index: true,
    },
    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
    },
    channel: {
      type: String,
      default: null,
    },
    gatewayTransactionId: {
      type: String,
      default: null,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationSource: {
      type: String,
      enum: ["manual", "webhook", null],
      default: null,
    },
    lastVerificationAttemptAt: {
      type: Date,
      default: null,
    },
    verifyAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    failureReason: {
      type: String,
      default: null,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PremiumPayment", premiumPaymentSchema);
