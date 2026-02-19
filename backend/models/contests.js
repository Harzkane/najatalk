// backend/models/contests.js
import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  prize: { type: Number, required: true },
  endDate: { type: Date, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Contest", contestSchema);
