import mongoose from "mongoose";

const walletLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  entryKind: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  walletEffect: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "completed",
  },
  reference: {
    type: String,
    default: null,
  },
  counterparty: {
    type: String,
    default: null,
  },
  recipientId: {
    type: String,
    default: null,
  },
  listingTitle: {
    type: String,
    default: null,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  heldBalance: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    default: null,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.model("WalletLedger", walletLedgerSchema);
