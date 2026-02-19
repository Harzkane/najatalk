// backend/models/ad.js
import mongoose from "mongoose";

const adSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  brand: { type: String, required: true },
  text: { type: String, required: true },
  link: { type: String, required: true },
  type: { type: String, enum: ["sidebar", "banner", "popup"], required: true },
  budget: { type: Number, required: true }, // kobo
  cpc: { type: Number, required: true }, // cost per click in kobo
  status: {
    type: String,
    enum: ["pending", "active", "paused", "expired"],
    default: "pending",
  },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ad", adSchema);
