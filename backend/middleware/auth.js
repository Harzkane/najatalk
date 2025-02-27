// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: "No token—abeg login!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User no dey!" });
    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Verify your email first, bros!" });

    req.user = user; // Pass user to controller
    // console.log("Auth user:", req.user); // Debug log

    next();
  } catch (err) {
    res.status(401).json({ message: "Token scatter: " + err.message });
  }
};
