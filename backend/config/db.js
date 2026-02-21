// backend/config/db.js
import mongoose from "mongoose";

const connectDB = async (uri) => {
  try {
    const normalizedUri = String(uri || "").trim();
    if (!normalizedUri) {
      throw new Error("MONGO_URI is missing. Add it to backend/.env");
    }
    if (
      !normalizedUri.startsWith("mongodb://") &&
      !normalizedUri.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        "Invalid MongoDB URI scheme. URI must start with mongodb:// or mongodb+srv://"
      );
    }
    await mongoose.connect(normalizedUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("MongoDB connected—NaijaTalk dey live!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
