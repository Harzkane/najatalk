// backend/routes/auth.js
import express from "express";
import { signup, login, verifyEmail } from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify/:token", verifyEmail);

export default router;
