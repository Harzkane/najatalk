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
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("User", userSchema);
