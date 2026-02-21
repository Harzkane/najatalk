// backend/models/thread.js
import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
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
  category: {
    type: String,
    default: "General",
  },
  createdAt: {
    type: Date,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isSolved: {
    type: Boolean,
    default: false,
  },
  solvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  solvedAt: {
    type: Date,
    default: null,
  },
  isSticky: {
    type: Boolean,
    default: false,
  },
  stickyBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  stickyAt: {
    type: Date,
    default: null,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  lockedAt: {
    type: Date,
    default: null,
  },
});

threadSchema.index({ title: "text", body: "text" });

export default mongoose.model("Thread", threadSchema);
