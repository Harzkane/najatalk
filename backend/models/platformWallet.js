// backend/models/platformWallet.js
import mongoose from "mongoose";

const platformWalletSchema = new mongoose.Schema({
  balance: {
    type: Number,
    default: 0, // In kobo (₦ * 100)
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("PlatformWallet", platformWalletSchema);
