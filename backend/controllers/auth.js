// backend/controllers/auth.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/email.js";
import { ASSIGNABLE_ROLES } from "../utils/permissions.js";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
const isValidEmail = (value = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const MIN_PASSWORD_LENGTH = 8;

const getBootstrapRole = (email = "") => {
  const normalized = normalizeEmail(email);
  const configured = String(process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
  if (configured.includes(normalized)) return "super_admin";
  return "user";
};

const applyBootstrapRoleIfNeeded = async (user) => {
  if (!user) return;
  const bootstrapRole = getBootstrapRole(user.email);
  if (bootstrapRole === "super_admin" && user.role !== "super_admin") {
    user.role = "super_admin";
    await user.save();
  }
};

export const signup = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  try {
    if (!normalizedEmail || !password)
      return res.status(400).json({ message: "Email or password no dey!" });
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email format no correct." });
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "Email dey already in use!" });

    const verificationToken = jwt.sign({ email: normalizedEmail }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const role = getBootstrapRole(normalizedEmail);
    const user = new User({
      email: normalizedEmail,
      password, // Raw password—hook will hash
      verificationToken,
      role: ASSIGNABLE_ROLES.includes(role) ? role : "user",
    });
    await user.save();

    await sendVerificationEmail(normalizedEmail, verificationToken);

    res
      .status(201)
      .json({ message: "Signup good—check your email to verify!" });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Email dey already in use!" });
    }
    console.error("Signup error details:", err);
    res.status(500).json({ message: "Signup scatter: " + err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  try {
    if (!normalizedEmail || !password)
      return res.status(400).json({ message: "Email or password no dey!" });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(404).json({ message: "User no dey—abeg signup!" });

    await applyBootstrapRoleIfNeeded(user);

    if (user.isBanned)
      return res
        .status(403)
        .json({ message: "You don dey banned—abeg comot!" });
    if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) {
      return res.status(403).json({
        message: `Account suspended until ${new Date(user.suspendedUntil).toISOString()}.`,
      });
    }

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
    res
      .status(200)
      .json({ token, userId: user._id, message: "Login sweet—welcome back!" });
  } catch (err) {
    res.status(500).json({ message: "Login scatter: " + err.message });
  }
};

export const resendVerification = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);
  try {
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email no dey!" });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email format no correct." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({
        message: "If this email exists, verification mail don resend.",
      });
    }
    if (user.isVerified) {
      return res.status(200).json({
        message: "Email already verified—abeg login.",
      });
    }

    const verificationToken = jwt.sign(
      { email: normalizedEmail },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    user.verificationToken = verificationToken;
    await user.save();
    await sendVerificationEmail(normalizedEmail, verificationToken);

    return res.status(200).json({
      message: "Verification mail don resend. Check your inbox.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    return res
      .status(500)
      .json({ message: "Resend verification scatter: " + err.message });
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

export const requestPasswordReset = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);
  try {
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email no dey!" });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email format no correct." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({
        message:
          "If this account exists, password reset instructions don send.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(normalizedEmail, token);

    return res.status(200).json({
      message: "If this account exists, password reset instructions don send.",
    });
  } catch (err) {
    console.error("Request password reset error:", err);
    return res
      .status(500)
      .json({ message: "Password reset request scatter: " + err.message });
  }
};

export const resetPassword = async (req, res) => {
  const token = String(req.params?.token || "").trim();
  const password = String(req.body?.password || "");
  try {
    if (!token) {
      return res.status(400).json({ message: "Reset token no dey." });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset token invalid or don expire." });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Password reset successful. Abeg login with new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res
      .status(500)
      .json({ message: "Password reset scatter: " + err.message });
  }
};
