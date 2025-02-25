// backend/index.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import threadRoutes from "./routes/threads.js";
import dbRoutes from "./routes/db.js";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
  })
);

app.use(express.json());
connectDB(process.env.MONGO_URI);
app.use("/api/auth", authRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/", dbRoutes); // Welcome route

app.listen(PORT, () => {
  console.log(`Server dey run for port ${PORT}`);
});
