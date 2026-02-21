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
  fulfillmentStatus: {
    type: String,
    enum: ["awaiting_seller", "shipped", "delivered", null],
    default: null,
  },
  orderDetails: {
    fullName: { type: String, default: null },
    phone: { type: String, default: null },
    addressLine1: { type: String, default: null },
    addressLine2: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    postalCode: { type: String, default: null },
    deliveryNote: { type: String, default: null },
  },
  buyerConfirmedAt: {
    type: Date,
    default: null,
  },
  shippedAt: {
    type: Date,
    default: null,
  },
  category: {
    type: String,
    enum: ["Electronics", "Fashion", "Home", "Food", "Services", "Others"],
    default: "Others",
  },
  imageUrls: {
    type: [String],
    default: [],
  },
  boostsPurchased: {
    type: Number,
    default: 0,
  },
  boostLevel: {
    type: Number,
    default: 0,
  },
  boostExpiresAt: {
    type: Date,
    default: null,
  },
  lastBoostedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

listingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Listing", listingSchema);
