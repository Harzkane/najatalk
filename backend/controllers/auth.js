// backend/controllers/auth.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendVerificationEmail } from "../utils/email.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: "Email or password no dey!" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email dey already in use!" });

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const user = new User({
      email,
      password, // Raw password—hook will hash
      verificationToken,
    });
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res
      .status(201)
      .json({ message: "Signup good—check your email to verify!" });
  } catch (err) {
    console.error("Signup error details:", err);
    res.status(500).json({ message: "Signup scatter: " + err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: "Email or password no dey!" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User no dey—abeg signup!" });

    if (user.isBanned)
      return res
        .status(403)
        .json({ message: "You don dey banned—abeg comot!" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Verify your email first, bros!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password no match—try again!" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });
    res.status(200).json({ token, message: "Login sweet—welcome back!" });
  } catch (err) {
    res.status(500).json({ message: "Login scatter: " + err.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.status(400).json({ message: "User no dey!" });
    if (user.isVerified)
      return res.json({
        message: "Email already verified—NaijaTalk dey open!",
      });

    if (user.verificationToken !== token) {
      return res.status(400).json({ message: "Verification token no good!" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: "Email verified—NaijaTalk dey open for you now!" });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Verification scatter: " + err.message });
  }
};
