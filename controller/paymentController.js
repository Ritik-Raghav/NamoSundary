import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_eaw8FUWQWt0bHV",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "Jhlpu6muzYAauO7BnHj3bbTz",
});

// Create a Razorpay order
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user_id = req.user.id;
    // Basic validation

    if (!amount || !user_id) {
      return res
        .status(200)
        .send({ status: 400, error: "Amount or user not found" });
    }

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(200).send({ status: 400, error: "Order not created" });
    }

    return res
      .status(200)
      .send({ status: 200, message: "Order created", order });
  } catch (err) {
    console.error("🔥 Razorpay error:", err);
    return res.status(500).send({ status: 500, error: err.message });
  }
};

// Verify Razorpay payment

export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency,
      product_id,
    } = req.body;

    const user_id = req.user.id;

    console.log(user_id);

    // Basic validation
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !amount ||
      !currency ||
      !product_id ||
      !user_id
    ) {
      return res
        .status(400)
        .json({ status: 400, error: "Missing required fields" });
    }

    // Create signature hash
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    const isValid = generatedSignature === razorpay_signature;
    const paymentData = {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
      amount: Math.round(amount / 100), // Convert paise to ₹ (if from Razorpay)
      currency,
      userId: parseInt(user_id), // Ensure it's an integer
      product_id: parseInt(product_id), // 👈 FIX THIS if it's a string
      status: isValid ? "success" : "failed",
    };
    await prisma.payment.create({ data: paymentData });

    return res.status(isValid ? 200 : 400).json({
      status: isValid ? 200 : 400,
      message: isValid
        ? "Payment verified successfully"
        : "Payment verification failed",
    });
  } catch (err) {
    console.error("💥 Payment verification error:", err);
    return next(err);
  }
};
