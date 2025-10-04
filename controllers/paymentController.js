import crypto from "crypto";
import razorpay from "../services/razorpay.js";
import {
  sendEmail,
  sendTwilioSMS,
  sendTwilioWhatsappMessage,
} from "../services/sendAllNotification.js";
// import { sendEmail } from "./email-service.js";
// import {
//   sendTwilioSMS,
//   sendTwilioWhatsappMessage,
// } from "./twilio-sms-service.js";

export const createOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // amount in paisa
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      res.status(200).json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
};

export const sendPaymentNotifications = async (req, res) => {
  try {
    const { name, email, phone, description, amount, gst, total } = req.body;

    const totalFormatted = parseFloat(total).toFixed(2);
    const amountFormatted = parseFloat(amount).toFixed(2);

    const message = `Hi ${name}, please pay ₹${totalFormatted} — {₹${amountFormatted} + ${gst}% GST} for: ${description}. Pay here: https://secure.ccavenue.com/txn/QBlc607`;

    const emailHtml = `
    <h3>Payment Request</h3>
    <p>Hi ${name},</p>
    <p>Please pay <strong>₹${totalFormatted}</strong> for the following:</p>
    <ul>
      <li><strong>Description:</strong> ${description}</li>
      <li><strong>Base Amount:</strong> ₹${amountFormatted}</li>
      <li><strong>GST:</strong> ${gst}%</li>
      <li><strong>Total Payable:</strong> ₹${totalFormatted}</li>
    </ul>
    <p><a href="https://secure.ccavenue.com/txn/QBlc607">Click here to pay</a></p>
  `;

    const formattedPhone = `${phone}`;

    const emailPromise = sendEmail({
      to: email,
      subject: `Payment Request for ₹${totalFormatted}`,
      html: emailHtml,
      text: message,
    });

    const smsPromise = sendTwilioSMS({
      to: formattedPhone,
      body: message,
    });

    const whatsappPromise = sendTwilioWhatsappMessage({
      to: formattedPhone,
      body: message,
    });

    await Promise.all([emailPromise, smsPromise, whatsappPromise]);

    // ✅ SEND RESPONSE TO CLIENT
    return res
      .status(200)
      .json({ success: true, message: "Notifications sent." });
  } catch (err) {
    console.error("sendPaymentNotifications error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
