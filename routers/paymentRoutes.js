import express from "express";
import {
  createOrder,
  sendPaymentNotifications,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.post("/sendPaymentNotifications", sendPaymentNotifications);

export default router;
