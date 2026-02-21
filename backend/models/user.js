// backend/models/user.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  role: {
    type: String,
    enum: ["user", "mod", "admin"],
    default: "user",
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  appealReason: {
    type: String,
    default: null,
  },
  appealStatus: {
    type: String,
    enum: ["pending", "approved", "rejected", null],
    default: null,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumStatus: {
    type: String,
    enum: ["inactive", "active", "expired", "canceled", "legacy"],
    default: "inactive",
    index: true,
  },
  premiumPlan: {
    type: String,
    enum: ["monthly", null],
    default: null,
  },
  premiumStartedAt: {
    type: Date,
    default: null,
  },
  premiumExpiresAt: {
    type: Date,
    default: null,
  },
  nextBillingAt: {
    type: Date,
    default: null,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  premiumCanceledAt: {
    type: Date,
    default: null,
  },
  premiumLastPaymentRef: {
    type: String,
    default: null,
  },
  flair: {
    type: String,
    enum: ["Verified G", "Oga at the Top", null],
    default: null,
  },
  username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    minlength: 3,
    maxlength: 24,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    trim: true,
    default: "",
    maxlength: 280,
  },
  location: {
    type: String,
    trim: true,
    default: "",
    maxlength: 80,
  },
  defaultDeliveryAddress: {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    deliveryNote: { type: String, default: "" },
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  savedListings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("User", userSchema);
