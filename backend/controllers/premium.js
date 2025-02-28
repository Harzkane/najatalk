// backend/controllers/premium.js
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import axios from "axios";

export const tipUser = async (req, res) => {
  const { recipientId, amount } = req.body; // Amount in ₦ (e.g., 50, 100, 200)
  const senderId = req.user._id;

  try {
    if (!recipientId || !amount || ![50, 100, 200].includes(amount)) {
      return res
        .status(400)
        .json({ message: "Abeg, send valid amount—₦50, ₦100, or ₦200!" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient)
      return res.status(404).json({ message: "Recipient no dey!" });

    console.log(
      `Initiating tip from ${req.user.email} to ${recipient.email} for ₦${amount}`
    );
    const reference = `naijatalk_tip_${Date.now()}`;
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL}/threads/tip-success?reference=${reference}&recipientId=${recipientId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Paystack tip response:", response.data);

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
    console.error("Tip Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Tip scatter: " + (err.message || err) });
  }
};

export const verifyTip = async (req, res) => {
  const { reference, recipientId } = req.query; // From callback URL
  const senderId = req.user._id;

  try {
    console.log("Verifying tip reference:", reference);
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      }
    );
    console.log("Paystack Verify Tip Response:", response.data);

    if (response.data.status && response.data.data.status === "success") {
      const amount = response.data.data.amount / 100; // Convert kobo to ₦
      const platformCut = amount * 0.1; // 10% cut
      const recipientAmount = amount - platformCut;

      // Update sender wallet (deduct)—create if not exists
      let senderWallet = await Wallet.findOne({ userId: senderId });
      if (!senderWallet) {
        senderWallet = new Wallet({ userId: senderId });
      }
      senderWallet.balance -= amount * 100; // Store in kobo
      await senderWallet.save();

      // Update recipient wallet (credit)—create if not exists
      let recipientWallet = await Wallet.findOne({ userId: recipientId });
      if (!recipientWallet) {
        recipientWallet = new Wallet({ userId: recipientId });
      }
      recipientWallet.balance += recipientAmount * 100; // Store in kobo
      await recipientWallet.save();

      res.json({ message: `Tip of ₦${recipientAmount} sent—enjoy the vibes!` });
    } else {
      res.status(400).json({ message: "Tip no work—try again!" });
    }
  } catch (err) {
    console.error("Verify Tip Error:", err.response?.data || err.message);
    res.status(500).json({
      message:
        "Verify scatter: " + (err.response?.data?.message || err.message),
      errorDetails: err.response?.data,
    });
  }
};

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
  const { reference } = req.body || req.query; // Handle POST or GET (callback)
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
      res.status(400).json({
        success: false,
        message: "Failed to update premium status",
      });
    }
  } catch (err) {
    console.error("Manual premium activation error:", err);
    res.status(500).json({
      success: false,
      message: "Premium activation failed: " + err.message,
    });
  }
};
