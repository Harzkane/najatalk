import mongoose from "mongoose";

const searchQueryLogSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      default: null,
      trim: true,
      maxlength: 160,
    },
    normalizedQuery: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "search_submit",
        "suggestion_click",
        "result_click",
        "category_filter",
      ],
      default: "search_submit",
      index: true,
    },
    category: {
      type: String,
      default: null,
      maxlength: 40,
      index: true,
    },
    source: {
      type: String,
      default: "web",
      maxlength: 40,
      index: true,
    },
    resultCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    hadResults: {
      type: Boolean,
      default: false,
      index: true,
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

searchQueryLogSchema.index({ createdAt: -1 });
searchQueryLogSchema.index({ normalizedQuery: 1, createdAt: -1 });

export default mongoose.model("SearchQueryLog", searchQueryLogSchema);
