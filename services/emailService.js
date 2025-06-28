import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Singleton transporter instance
let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // transporter = nodemailer.createTransport({
  //   host: `email-smtp.${process.env.SES_REGION}.amazonaws.com`,
  //   port: 465, // or 587 if you prefer STARTTLS
  //   secure: true, // true for 465, false for 587
  //   auth: {
  //     user: process.env.SES_SMTP_USER,
  //     pass: process.env.SES_SMTP_PASS,
  //   },
  // });

  return transporter;
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  cc,
  bcc,
  attachments,
}) => {
  try {
    const transporter = createTransporter();

    const formatList = (val) =>
      Array.isArray(val) ? val.join(", ") : typeof val === "string" ? val : "";

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: formatList(to || process.env.RECIPIENT_EMAIL),
      subject,
      text,
      html,
      ...(cc && { cc: formatList(cc) }),
      ...(bcc && { bcc: formatList(bcc) }),
      ...(attachments && { attachments }),
    };

    // const mailOptions = {
    //   from: process.env.SES_EMAIL_FROM || process.env.SES_SMTP_USER,
    //   to: formatList(to || process.env.RECIPIENT_EMAIL),
    //   subject,
    //   text,
    //   html,
    //   ...(cc && { cc: formatList(cc) }),
    //   ...(bcc && { bcc: formatList(bcc) }),
    //   ...(attachments && { attachments }),
    // };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Email sending failed:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`Email send failed: ${error.message}`);
  }
};
