// backend/utils/email.js
import nodemailer from "nodemailer";

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email creds no dey—check .env!");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    timeout: 10000,
  });
};

export const sendEmail = async ({ to, subject, text, html = undefined }) => {
  const transporter = getTransporter();
  const recipients = Array.isArray(to)
    ? to.map((item) => String(item || "").trim()).filter(Boolean)
    : String(to || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!recipients.length) {
    throw new Error("No email recipient configured.");
  }

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipients.join(","),
    subject,
    text,
    html,
  });
};

export const sendVerificationEmail = async (email, token) => {
  try {
    return await sendEmail({
      to: email,
      subject: "Verify Your NaijaTalk Account",
      text: `Oga, click dis link to verify: ${process.env.FRONTEND_URL}/verify/${token}`,
    });
  } catch (err) {
    console.error("Email send error:", err);
    throw err;
  }
};
