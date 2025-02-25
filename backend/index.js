// backend/index.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import dbRoutes from "./routes/auth.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
connectDB(process.env.MONGO_URI);
app.use("/auth", authRoutes);
app.use("/", dbRoutes); // Welcome route

app.listen(PORT, () => {
  console.log(`Server dey run for port ${PORT}`);
});
