import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Thread",
    required: true,
  },
  createdAt: {
    type: Date,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
});

export default mongoose.model("Reply", replySchema);
