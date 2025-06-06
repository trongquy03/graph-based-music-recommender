import PayOS from '@payos/node';
import { premiumPlans } from "../lib/premiumPlans.js";
import { User } from "../models/user.model.js";

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

export const createPayment = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = premiumPlans[planId];
    const userId = req.auth.userId;

    if (!plan) {
      return res.status(400).json({ message: "Gói không tồn tại" });
    }

    const orderCode = Math.floor(Math.random() * 10000000);

    const paymentLink = await payos.createPaymentLink({
      orderCode,
      amount: plan.price,
      description: plan.name,
      returnUrl: "http://localhost:3000/premium-success",
      cancelUrl: "http://localhost:3000/premium-cancel",
      webhookUrl: process.env.WEBHOOK_URL
,
      metadata: {
        userId,
        planId: plan.id,
      },
    });

    return res.json({ paymentUrl: paymentLink.checkoutUrl });
  } catch (error) {
    console.error("Lỗi tạo đơn hàng:", error?.response?.data || error.message);
    next(error);
  }
};

export const payosWebhook = async (req, res, next) => {
    const event = req.body;

  if (event.code === "PAYMENT_SUCCESS") {
    const { metadata } = event.data;
    const { userId, planId } = metadata;
    const plan = premiumPlans[planId];

    if (!plan) return res.status(400).send("Gói không hợp lệ");

    // Tính thời hạn hết hạn PREMIUM
    const now = new Date();
    now.setDate(now.getDate() + plan.days);

    try {
      await User.findOneAndUpdate(
        { clerkId: userId },
        {
          isPremium: true,
          premiumUntil: now,

        }
      );
      return res.status(200).send("Đã cập nhật PREMIUM");
    } catch (err) {
      console.error(" Lỗi cập nhật user:", err.message);
      return res.status(500).send("Lỗi cập nhật");
    }
  }

  res.status(200).send("Webhook received");
};


