// backend/models/contests.js
import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, default: "general" },
  rules: { type: String, default: "" },
  termsVersion: { type: String, default: "2026-02-21" },
  termsUrl: { type: String, default: "/contests/terms" },
  policyUrl: { type: String, default: "/contests/policy" },
  requireTermsAcceptance: { type: Boolean, default: true },
  prize: { type: Number, required: true },
  status: {
    type: String,
    enum: ["draft", "live", "closed", "archived"],
    default: "draft",
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  votingEnabled: { type: Boolean, default: true },
  maxSubmissionsPerUser: { type: Number, default: 1 },
  winnerSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ContestSubmission",
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

contestSchema.index({ status: 1, startDate: 1, endDate: 1 });
contestSchema.index({ title: "text", description: "text", category: "text" });

export default mongoose.model("Contest", contestSchema);
