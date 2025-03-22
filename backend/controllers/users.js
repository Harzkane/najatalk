// backend/controllers/users.js

import mongoose from "mongoose";
import User from "../models/user.js";
import bcrypt from "bcryptjs"; // Add this import
import Listing from "../models/listing.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";

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

// export const getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select("email isPremium");
//     if (!user) return res.status(404).json({ message: "User no dey!" });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: "Fetch scatter: " + err.message });
//   }
// };

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id email flair isPremium role"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    res.json({ ...user.toObject(), message: "You dey here—welcome!" }); // Flatten user object
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const setFlair = async (req, res) => {
  const { flair } = req.body;
  try {
    if (!req.user.isPremium) {
      return res.status(403).json({ message: "Abeg, premium only!" });
    }
    if (!["Verified G", "Oga at the Top"].includes(flair)) {
      return res.status(400).json({ message: "Flair no valid!" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { flair },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    res.json({ message: "Flair set—shine on, bros!", user });
  } catch (err) {
    res.status(500).json({ message: "Flair scatter: " + err.message });
  }
};

export const getUserProfilePublic = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid user ID—check am well!" });
    }

    const user = await User.findById(userId).select("email flair");
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const listings = await Listing.find({ userId }).select(
      "title description price category status createdAt updatedAt"
    );

    res.json({
      user: { email: user.email, flair: user.flair },
      listings,
      message: "User profile dey here—check am!",
    });
  } catch (err) {
    res.status(500).json({ message: "Profile fetch scatter: " + err.message });
  }
};

export const getSellerWallet = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid user ID—check am well!" });
    }
    if (req.user._id.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "No be your wallet—abeg comot!" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res
        .status(200)
        .json({ balance: 0, message: "Wallet empty—start dey sell!" });
    }

    const transactions = await Transaction.find({
      receiverId: userId,
      status: "completed",
      type: "escrow",
    })
      .populate("listingId", "title")
      .select("amount createdAt listingId");

    res.json({
      balance: wallet.balance,
      transactions: transactions.map((t) => ({
        amount: t.amount - (t.platformCut || 0), // Seller gets amount minus cut
        listingTitle: t.listingId?.title || "Unknown Listing",
        date: t.createdAt,
      })),
      message: "Seller wallet dey here—check am!",
    });
  } catch (err) {
    console.error("Seller Wallet Error:", err);
    res.status(500).json({ message: "Wallet fetch scatter: " + err.message });
  }
};
