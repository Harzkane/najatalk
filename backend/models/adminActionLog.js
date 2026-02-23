import mongoose from "mongoose";

const adminActionLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      default: null,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

adminActionLogSchema.index({ action: 1, createdAt: -1 });
adminActionLogSchema.index({ targetUserId: 1, createdAt: -1 });
adminActionLogSchema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model("AdminActionLog", adminActionLogSchema);
