import dotenv from "dotenv";
import nodemailer from "nodemailer";
import twilio from "twilio";

dotenv.config();

// ------------------------------
// Nodemailer Setup
// ------------------------------
let emailTransporter = null;

const createTransporter = () => {
  if (emailTransporter) return emailTransporter;

  emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return emailTransporter;
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
      to: formatList(to),
      subject,
      text,
      html,
      ...(cc && { cc: formatList(cc) }),
      ...(bcc && { bcc: formatList(bcc) }),
      ...(attachments && { attachments }),
    };

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

// ------------------------------
// Twilio Setup
// ------------------------------
let twilioClient = null;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not set in environment variables");
  }

  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
};

export const sendTwilioSMS = async ({ to, body }) => {
  try {
    const client = getTwilioClient();
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!from) throw new Error("Missing TWILIO_PHONE_NUMBER in .env");

    const message = await client.messages.create({ body, from, to });
    return message;
  } catch (error) {
    console.error("SMS sending failed:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`SMS send failed: ${error.message}`);
  }
};

export const sendTwilioWhatsappMessage = async ({ to, body }) => {
  try {
    const client = getTwilioClient();
    const from = "whatsapp:+14155238886";
    const formattedTo = `whatsapp:${to}`;

    const message = await client.messages.create({
      body,
      from,
      to: formattedTo,
    });

    return message;
  } catch (error) {
    console.error("WhatsApp sending failed:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`WhatsApp send failed: ${error.message}`);
  }
};
