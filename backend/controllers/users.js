// backend/controllers/users.js
import User from "../models/user.js";
import bcrypt from "bcryptjs"; // Add this import

export const banUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    res.json({ message: "User don dey banned—e don finish!" });
  } catch (err) {
    res.status(500).json({ message: "Ban scatter: " + err.message });
  }
};

export const getBannedUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const bannedUsers = await User.find({ isBanned: true }).select(
      "email appealReason appealStatus"
    );
    res.json({ bannedUsers, message: "Banned users dey here—check am!" });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const appealBan = async (req, res) => {
  const { email, password, reason } = req.body;
  try {
    if (!email || !password || !reason)
      return res
        .status(400)
        .json({ message: "Email, password, or reason no dey!" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password no match—try again!" });

    if (!user.isBanned)
      return res
        .status(400)
        .json({ message: "You no dey banned—why you dey appeal?" });
    if (user.appealStatus === "pending")
      return res
        .status(400)
        .json({ message: "Your appeal dey pending—abeg wait!" });
    if (user.appealStatus === "approved")
      return res.status(400).json({ message: "You don dey unbanned—enjoy!" });

    await User.findByIdAndUpdate(
      user._id,
      { appealReason: reason, appealStatus: "pending" },
      { new: true }
    );
    res.json({ message: "Appeal sent—mods go check am!" });
  } catch (err) {
    res.status(500).json({ message: "Appeal scatter: " + err.message });
  }
};

export const unbanUser = async (req, res) => {
  const { userId } = req.params;
  const { approve } = req.body;
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User no dey!" });
    if (!user.isBanned)
      return res
        .status(400)
        .json({ message: "User no dey banned—no need to unban!" });

    const update = approve
      ? { isBanned: false, appealStatus: "approved", appealReason: null }
      : { appealStatus: "rejected" };
    await User.findByIdAndUpdate(userId, update, { new: true });
    res.json({
      message: approve
        ? "User don dey unbanned—welcome back!"
        : "Appeal rejected—stay banned!",
    });
  } catch (err) {
    res.status(500).json({ message: "Unban scatter: " + err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email isPremium");
    if (!user) return res.status(404).json({ message: "User no dey!" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};
