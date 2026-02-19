// backend/utils/email.js
import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, token) => {
  try {
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your NaijaTalk Account",
      text: `Oga, click dis link to verify: ${process.env.FRONTEND_URL}/verify/${token}`,
    };

    console.log("Sending email to:", email);
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result);
    return result;
  } catch (err) {
    console.error("Email send error:", err);
    throw err;
  }
};
