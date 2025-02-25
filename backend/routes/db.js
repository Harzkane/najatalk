// backend/routes/db.js
import express from "express";
import { homeController } from "../controllers/db.js";

const router = express.Router();

router.get("/", homeController);

export default router;
