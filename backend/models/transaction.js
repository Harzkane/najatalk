// // backend/models/transaction.js
// import mongoose from "mongoose";

// const transactionSchema = new mongoose.Schema({
//   senderId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   recipientId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true, // In kobo
//   },
//   platformCut: {
//     type: Number,
//     required: true, // In kobo
//   },
//   reference: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "completed", "failed"],
//     default: "pending",
//   },
//   createdAt: {
//     type: Date,
//     default: () =>
//       new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
//   },
//   updatedAt: {
//     type: Date,
//     default: () =>
//       new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
//   },
// });

// export default mongoose.model("Transaction", transactionSchema);

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
    enum: ["escrow", "payout", "refund"],
    required: [true, "Type must dey—wetin we dey do?"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  reference: {
    type: String,
    required: true,
    default: null, // Optional for now
  },
  platformCut: {
    type: Number,
    default: 0, // Optional, add later
  },
  recipientId: {
    type: String,
    default: null, // Optional, for payment gateway
  },
  createdAt: {
    type: String,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
  updatedAt: {
    type: String,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
});

transactionSchema.pre("save", function (next) {
  this.updatedAt = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
  });
  next();
});

export default mongoose.model("Transaction", transactionSchema);
