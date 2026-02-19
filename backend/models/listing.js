import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Abeg, give your item a title!"],
    trim: true,
    maxlength: [100, "Title too long—keep am short, bros!"],
  },
  description: {
    type: String,
    required: [true, "No description? Tell us wetin you dey sell na!"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price must dey—how we go buy am?"],
    min: [100, "Price too small—minimum na ₦1 (100 kobo)!"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller must dey—who dey sell this thing?"],
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    default: null,
  },
  status: {
    type: String,
    enum: ["active", "pending", "sold", "deleted"],
    default: "active",
  },
  category: {
    type: String,
    enum: ["Electronics", "Fashion", "Home", "Food", "Services", "Others"],
    default: "Others",
  },
  createdAt: {
    type: String,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
  updatedAt: {
    type: String,
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
});

listingSchema.pre("save", function (next) {
  this.updatedAt = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
  });
  next();
});

export default mongoose.model("Listing", listingSchema);
