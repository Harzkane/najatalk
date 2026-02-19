// backend/models/wallet.js
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0, // In kobo (₦0.00)
  },
  createdAt: {
    type: String, // Match listing/transaction
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
  updatedAt: {
    type: Date,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
});

export default mongoose.model("Wallet", walletSchema);
