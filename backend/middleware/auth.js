// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { syncPremiumAccessState } from "../utils/premiumAccess.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token—abeg login!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "_id email role permissions deniedPermissions isVerified isBanned suspendedUntil suspensionReason suspendedBy appealStatus isPremium profileCompleted premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd premiumCanceledAt premiumLastPaymentRef"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const { changed } = syncPremiumAccessState(user);
    if (changed) {
      await user.save();
    }

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Verify your email first, bros!" });
    if (user.isBanned && user.appealStatus !== "approved")
      return res
        .status(403)
        .json({ message: "You don dey banned—abeg comot!" });
    if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) {
      return res.status(403).json({
        message: `Account suspended until ${new Date(user.suspendedUntil).toISOString()}.`,
      });
    }

    req.user = user;
    // console.log("Auth user:", req.user); // Log user
    next();
  } catch (err) {
    console.error("Auth Error:", err.message); // Log error
    res.status(401).json({ message: "Token scatter: " + err.message });
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "_id email role permissions deniedPermissions isVerified isBanned suspendedUntil suspensionReason suspendedBy appealStatus isPremium profileCompleted premiumStatus premiumPlan premiumStartedAt premiumExpiresAt nextBillingAt cancelAtPeriodEnd premiumCanceledAt premiumLastPaymentRef"
    );

    const isSuspended =
      user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now();
    if (
      !user ||
      !user.isVerified ||
      (user.isBanned && user.appealStatus !== "approved") ||
      isSuspended
    ) {
      req.user = null;
      return next();
    }

    const { changed } = syncPremiumAccessState(user);
    if (changed) {
      await user.save();
    }

    req.user = user;
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
};
