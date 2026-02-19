import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Who’s being reported
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
});

export default mongoose.model("Report", reportSchema);
