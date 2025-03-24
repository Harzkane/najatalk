// backend/controllers/users.js

import mongoose from "mongoose";
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import axios from "axios";
import bcrypt from "bcryptjs";
import Listing from "../models/listing.js";
import Thread from "../models/thread.js";

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
    const user = await User.findById(req.user._id).select(
      "_id email flair isPremium role"
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    const threadCount = await Thread.countDocuments({ userId: req.user._id });
    res.json({
      ...user.toObject(),
      threadCount,
      message: "You dey here—welcome!",
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

// export const setFlair = async (req, res) => {
//   const { flair } = req.body;
//   try {
//     if (!req.user.isPremium) {
//       return res.status(403).json({ message: "Abeg, premium only!" });
//     }
//     if (!["Verified G", "Oga at the Top"].includes(flair)) {
//       return res.status(400).json({ message: "Flair no valid!" });
//     }
//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { flair },
//       { new: true }
//     );
//     if (!user) return res.status(404).json({ message: "User no dey!" });
//     res.json({ message: "Flair set—shine on, bros!", user });
//   } catch (err) {
//     res.status(500).json({ message: "Flair scatter: " + err.message });
//   }
// };

export const updateUserFlair = async (req, res) => {
  const { flair } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User no dey!" });

    const threadCount = await Thread.countDocuments({ userId: req.user._id });
    const availableFlairs = ["Verified G", "Oga at the Top"];

    // Auto-assign "Verified G" if 10+ threads and no premium
    if (threadCount >= 10 && !user.isPremium && !user.flair) {
      user.flair = "Verified G";
    }

    // Premium users can pick flair
    if (user.isPremium && flair) {
      if (!availableFlairs.includes(flair)) {
        return res
          .status(400)
          .json({ message: "Flair no valid—pick correct one!" });
      }
      user.flair = flair;
    } else if (!user.isPremium && flair) {
      return res.status(403).json({ message: "Premium only—abeg subscribe!" });
    }

    await user.save();
    res.json({ message: "Flair updated—shine on!", flair: user.flair });
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
        amount: t.amount - (t.platformCut || 0),
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

// export const sendTip = async (req, res) => {
//   const { receiverId, amount } = req.body;
//   const senderId = req.user._id;

//   try {
//     if (!mongoose.Types.ObjectId.isValid(receiverId)) {
//       return res.status(400).json({ message: "Invalid receiver ID—check am!" });
//     }
//     if (!amount || ![50, 100, 200].includes(amount)) {
//       return res
//         .status(400)
//         .json({ message: "Tip must be ₦50, ₦100, or ₦200—abeg adjust!" });
//     }

//     const receiver = await User.findById(receiverId);
//     if (!receiver) return res.status(404).json({ message: "Receiver no dey!" });

//     const senderWallet = await Wallet.findOne({ userId: senderId });
//     const senderBalance = senderWallet ? senderWallet.balance / 100 : 0;
//     if (senderBalance < amount) {
//       return res.status(400).json({ message: "Funds no dey—top up!" });
//     }

//     const reference = `naijatalk_tip_${Date.now()}`;
//     const platformCut = amount * 0.1;
//     const transaction = new Transaction({
//       senderId,
//       receiverId,
//       amount: amount * 100,
//       platformCut: platformCut * 100,
//       reference,
//       type: "tip",
//       status: "pending",
//     });
//     await transaction.save();

//     const callbackUrl = `${process.env.FRONTEND_URL}/threads/tip-success?reference=${reference}&receiverId=${receiverId}`;
//     console.log(
//       `[sendTip] Initiating Paystack: ref=${reference}, callback=${callbackUrl}`
//     );

//     const response = await axios.post(
//       "https://api.paystack.co/transaction/initialize",
//       {
//         email: req.user.email,
//         amount: amount * 100,
//         reference,
//         callback_url: callbackUrl,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(`[sendTip] Paystack response:`, response.data);

//     if (response.data.status) {
//       res.json({
//         paymentLink: response.data.data.authorization_url,
//         reference,
//         message: "Tip dey go—abeg complete am!",
//       });
//     } else {
//       throw new Error("Tip init scatter!");
//     }
//   } catch (err) {
//     console.error("[sendTip] Error:", err.response?.data || err.message);
//     res.status(500).json({ message: "Tip scatter: " + (err.message || err) });
//   }
// };

// backend/controllers/users.js

// backend/controllers/users.js
export const sendTip = async (req, res) => {
  const { receiverId, amount } = req.body;
  const senderId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID—check am!" });
    }
    if (!amount || ![50, 100, 200].includes(amount)) {
      return res
        .status(400)
        .json({ message: "Tip must be ₦50, ₦100, or ₦200—abeg adjust!" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver no dey!" });

    const senderWallet = await Wallet.findOne({ userId: senderId });
    const senderBalance = senderWallet ? senderWallet.balance / 100 : 0;
    if (senderBalance < amount) {
      return res.status(400).json({ message: "Funds no dey—top up!" });
    }

    const reference = `naijatalk_tip_${Date.now()}`;
    const platformCut = amount * 0.1;
    const transaction = new Transaction({
      senderId,
      receiverId,
      amount: amount * 100,
      platformCut: platformCut * 100,
      reference,
      type: "tip",
      status: "pending",
    });
    await transaction.save();

    const callbackUrl = `${process.env.FRONTEND_URL}/threads?reference=${reference}&receiverId=${receiverId}`;
    console.log(
      `[sendTip] Initiating Paystack: ref=${reference}, callback=${callbackUrl}`
    );

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[sendTip] Paystack response:`, response.data);

    if (response.data.status) {
      res.json({
        paymentLink: response.data.data.authorization_url,
        reference,
        message: "Tip dey go—abeg complete am!",
      });
    } else {
      throw new Error("Tip init scatter!");
    }
  } catch (err) {
    console.error("[sendTip] Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Tip scatter: " + (err.message || err) });
  }
};

export const verifyTip = async (req, res) => {
  const { reference, receiverId } = req.body;
  const senderId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID—check am!" });
    }

    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction no dey!" });
    }
    if (transaction.status === "completed") {
      return res.status(200).json({ message: "Tip already verified—chill!" });
    }

    console.log(
      `[verifyTip] Starting: ref=${reference}, sender=${senderId}, receiver=${receiverId}`
    );

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );
    console.log(`[verifyTip] Paystack response:`, response.data);

    if (response.data.status && response.data.data.status === "success") {
      const paystackAmount = response.data.data.amount;
      const platformCut = transaction.platformCut || paystackAmount * 0.1;
      const receiverAmount = paystackAmount - platformCut;

      transaction.status = "completed";
      transaction.amount = paystackAmount;
      transaction.platformCut = platformCut;
      await transaction.save();
      console.log(`[verifyTip] Transaction updated: ${transaction._id}`);

      let senderWallet = await Wallet.findOne({ userId: senderId });
      if (!senderWallet)
        senderWallet = new Wallet({ userId: senderId, balance: 0 });
      if (senderWallet.balance < paystackAmount) {
        return res.status(400).json({ message: "Funds no reach—abeg top up!" });
      }

      if (senderId.toString() === receiverId) {
        senderWallet.balance -= platformCut; // Only deduct platform fee
        await senderWallet.save();
        console.log(
          `[verifyTip] Self-tip wallet: ${senderWallet.balance} kobo`
        );
      } else {
        senderWallet.balance -= paystackAmount;
        await senderWallet.save();
        console.log(`[verifyTip] Sender wallet: ${senderWallet.balance} kobo`);

        let receiverWallet = await Wallet.findOne({ userId: receiverId });
        if (!receiverWallet)
          receiverWallet = new Wallet({ userId: receiverId, balance: 0 });
        receiverWallet.balance += receiverAmount;
        await receiverWallet.save();
        console.log(
          `[verifyTip] Receiver wallet: ${receiverWallet.balance} kobo`
        );
      }

      res.json({
        message: `Tip of ₦${receiverAmount / 100} sent—enjoy the vibes!`,
      });
    } else {
      transaction.status = "failed";
      await transaction.save();
      console.log(`[verifyTip] Transaction failed: ${reference}`);
      res.status(400).json({ message: "Tip no work—Paystack no gree!" });
    }
  } catch (err) {
    console.error("[verifyTip] Error:", err.response?.data || err.message);
    res.status(500).json({
      message:
        "Verify scatter: " + (err.response?.data?.message || err.message),
    });
  }
};
