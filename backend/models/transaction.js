// backend/models/transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Sender must dey—who dey pay?"],
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Receiver must dey—who dey collect?"],
  },
  amount: {
    type: Number,
    required: [true, "Amount must dey—how much?"],
    min: [100, "Minimum na ₦1 (100 kobo)!"],
  },
  type: {
    type: String,
    enum: ["escrow", "payout", "refund", "tip"],
    required: [true, "Type must dey—wetin we dey do?"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  reference: {
    type: String,
    default: null, // Optional for now
  },
  platformCut: {
    type: Number,
    default: 0, // Optional, add later
  },
  marketplaceFeeBps: {
    type: Number,
    default: null,
  },
  recipientId: {
    type: String,
    default: null, // Optional, for payment gateway
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    default: null,
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    default: null, // Optional, for tipping threads
  },
  replyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reply",
    default: null, // Optional, for tipping replies
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Transaction", transactionSchema);
