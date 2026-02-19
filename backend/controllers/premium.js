// backend/controllers/premium.js
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import axios from "axios";

export const initiatePremium = async (req, res) => {
  const { email } = req.user;
  const reference = `naijatalk_premium_${Date.now()}`;
  try {
    console.log("Initiating Paystack payment for:", email);
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: 50000, // ₦500 in kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL}/premium/success?reference=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Paystack initiate response:", response.data);
    if (response.data.status) {
      res.json({
        paymentLink: response.data.data.authorization_url,
        reference,
        message: "Payment dey go—abeg complete am!",
      });
    } else {
      throw new Error("Payment init scatter!");
    }
  } catch (err) {
    console.error("Initiate Error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ message: "Premium scatter: " + (err.message || err) });
  }
};

export const verifyPremium = async (req, res) => {
  const { reference } = req.body || req.query;
  try {
    console.log("Verifying Paystack reference:", reference);
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      }
    );
    console.log("Paystack Verify Response:", response.data);
    if (response.data.status && response.data.data.status === "success") {
      await User.findByIdAndUpdate(
        req.user._id,
        { isPremium: true },
        { new: true }
      );
      res.json({ message: "Premium activated—enjoy the VIP vibes!" });
    } else {
      res.status(400).json({ message: "Payment no work—try again!" });
    }
  } catch (err) {
    console.error("Verify Error:", err.response?.data || err.message);
    res.status(500).json({
      message:
        "Verify scatter: " + (err.response?.data?.message || err.message),
      errorDetails: err.response?.data,
    });
  }
};

export const completePremium = async (req, res) => {
  try {
    console.log("Manual premium activation for user:", req.user.email);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true },
      { new: true }
    );
    if (updatedUser && updatedUser.isPremium) {
      res.json({
        success: true,
        message: "Premium manually activated successfully!",
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to update premium status" });
    }
  } catch (err) {
    console.error("Manual premium activation error:", err);
    res.status(500).json({
      success: false,
      message: "Premium activation failed: " + err.message,
    });
  }
};

export const getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    console.log(
      "Fetching wallet for:",
      req.user.email,
      "Balance:",
      wallet?.balance
    );
    if (!wallet || typeof wallet.balance !== "number") {
      return res.json({ balance: 0, message: "No wallet yet—start funding!" });
    }
    res.json({ balance: wallet.balance, message: "Wallet dey here!" }); // Return kobo
  } catch (err) {
    console.error("Wallet Error:", err.message);
    res.status(500).json({ message: "Wallet fetch scatter: " + err.message });
  }
};

export const getTipHistory = async (req, res) => {
  try {
    console.log("Fetching tip history for:", req.user.email);
    const tipsSent = await Transaction.find({
      senderId: req.user._id,
      status: "completed",
      type: "tip", // Filter by tip type
    }).lean();
    const tipsReceived = await Transaction.find({
      receiverId: req.user._id,
      status: "completed",
      type: "tip",
    }).lean();
    const sentPromises = tipsSent.map(async (t) => ({
      amount: t.amount / 100,
      date: t.updatedAt,
      to: (await User.findById(t.receiverId))?.email || "Unknown",
    }));
    const receivedPromises = tipsReceived.map(async (t) => ({
      amount: (t.amount - t.platformCut) / 100,
      date: t.updatedAt,
      from: (await User.findById(t.senderId))?.email || "Unknown",
    }));

    const sent = await Promise.all(sentPromises);
    const received = await Promise.all(receivedPromises);

    res.json({ sent, received, message: "Tip history dey here!" });
  } catch (err) {
    console.error("Tip History Error:", err.message);
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};
