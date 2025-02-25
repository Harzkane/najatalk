// backend/controllers/auth.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/user.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: "Email or password no dey!" });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email creds no dey—check .env!");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      debug: true,
      timeout: 10000,
    });

    // Verify inside signup, before sending
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error("Nodemailer setup error:", error);
          reject(error);
        } else {
          console.log("Nodemailer ready—email dey go!");
          resolve(success);
        }
      });
    });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email dey already in use!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const user = new User({
      email,
      password: hashedPassword,
      verificationToken,
    });
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your NaijaTalk Account",
      text: `Oga, click dis link to verify: ${process.env.FRONTEND_URL}/verify/${verificationToken}`, // Updated to /verify/
    };
    console.log("Sending email to:", email);
    const emailResult = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", emailResult);

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
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User no dey!" });
    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Verify your email first, bros!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password no correct!" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, message: "Login sweet—welcome back!" });
  } catch (err) {
    res.status(500).json({ message: "Login wahala: " + err.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      email: decoded.email,
    });

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
