import mongoose from "mongoose";

const contestSubmissionSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
      index: true,
    },
    title: { type: String, default: "" },
    summary: { type: String, default: "" },
    termsAccepted: { type: Boolean, default: false },
    termsVersionAccepted: { type: String, default: "" },
    termsAcceptedAt: { type: Date, default: null },
    contestRulesSnapshot: { type: String, default: "" },
    contestTermsUrlSnapshot: { type: String, default: "" },
    contestPolicyUrlSnapshot: { type: String, default: "" },
    prizeClaim: {
      status: {
        type: String,
        enum: ["not_requested", "pending_review", "approved", "rejected", "paid"],
        default: "not_requested",
      },
      requestedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewNote: { type: String, default: "" },
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      idType: { type: String, default: "" },
      idNumberLast4: { type: String, default: "" },
      payoutReference: { type: String, default: "" },
      paidAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "winner"],
      default: "pending",
    },
    score: { type: Number, default: 0 },
    voteCount: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

contestSubmissionSchema.index({ contestId: 1, userId: 1, createdAt: -1 });
contestSubmissionSchema.index({ contestId: 1, status: 1, voteCount: -1 });

export default mongoose.model("ContestSubmission", contestSubmissionSchema);
