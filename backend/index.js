// backend/index.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import routes from "./routes/db.js";

dotenv.config();
console.log("MONGO_URI Loaded:", process.env.MONGO_URI); // Debug with right key
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
connectDB(process.env.MONGO_URI); // Pass URI explicitly
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server dey run for port ${PORT}`);
});
