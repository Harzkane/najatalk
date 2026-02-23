// backend/controllers/auth.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendVerificationEmail } from "../utils/email.js";
import { ASSIGNABLE_ROLES } from "../utils/permissions.js";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

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
  try {
    if (!email || !password)
      return res.status(400).json({ message: "Email or password no dey!" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email dey already in use!" });

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const role = getBootstrapRole(email);
    const user = new User({
      email,
      password, // Raw password—hook will hash
      verificationToken,
      role: ASSIGNABLE_ROLES.includes(role) ? role : "user",
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
