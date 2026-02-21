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
    default: 0, // Legacy total (available + held), kept for compatibility
  },
  availableBalance: {
    type: Number,
    default: 0, // Spendable kobo
  },
  heldBalance: {
    type: Number,
    default: 0, // Escrow-held kobo
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

walletSchema.pre("save", function (next) {
  this.availableBalance = Number(this.availableBalance || 0);
  this.heldBalance = Number(this.heldBalance || 0);
  this.balance = this.availableBalance + this.heldBalance;
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Wallet", walletSchema);
