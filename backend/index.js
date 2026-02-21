// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import threadRoutes from "./routes/threads.js";
import adsRoutes from "./routes/ads.js";
import dbRoutes from "./routes/db.js";
import usersRoutes from "./routes/users.js";
import premiumRoutes from "./routes/premium.js";
import marketplaceRoutes from "./routes/marketplace.js";
import contestsRoutes from "./routes/contests.js";

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

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/contests", contestsRoutes);

app.use("/api/", dbRoutes); // Welcome route

const startServer = async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Server dey run for port ${PORT}`);
  });
};

startServer();
