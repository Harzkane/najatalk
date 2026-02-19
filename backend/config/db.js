// backend/config/db.js
import mongoose from "mongoose";

const connectDB = async (uri) => {
  try {
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      throw new Error(
        "Invalid MongoDB URI scheme. URI must start with mongodb:// or mongodb+srv://"
      );
    }
    await mongoose.connect(uri.trim());
    console.log("MongoDB connected—NaijaTalk dey live!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
