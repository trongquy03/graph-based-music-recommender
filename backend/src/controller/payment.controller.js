import PayOS from '@payos/node';
import { premiumPlans } from "../lib/premiumPlans.js";
import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

export const createPayment = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const clerkId = req.auth.userId;

    const plan = premiumPlans[planId];
    if (!plan) return res.status(400).json({ message: "Gói không tồn tại" });

    const orderCode = Math.floor(Math.random() * 1_000_000_00);

    // Tạo đơn trong DB
    await Order.create({ orderCode, clerkId, planId });

    const paymentLink = await payos.createPaymentLink({
      orderCode,
      amount: plan.price,
      description: plan.name,
      returnUrl: "http://localhost:3000/premium-success",
      cancelUrl: "http://localhost:3000/premium-cancel",
      webhookUrl: process.env.WEBHOOK_URL,
    });

    return res.json({ paymentUrl: paymentLink.checkoutUrl });
  } catch (err) {
    console.error("Lỗi tạo đơn hàng:", err.message);
    next(err);
  }
};

export const payosWebhook = async (req, res) => {
  const event = req.body;


  const orderCode = event.data?.orderCode;
  if (!orderCode) return res.status(400).send("Thiếu orderCode");

  try {
    const order = await Order.findOne({ orderCode });
    if (!order) return res.status(404).send("Không tìm thấy đơn hàng");

    const plan = premiumPlans[order.planId];
    if (!plan) return res.status(400).send("Gói không hợp lệ");

    const now = new Date();
    now.setDate(now.getDate() + plan.days);

    await User.findOneAndUpdate(
      { clerkId: order.clerkId },
      { isPremium: true, premiumUntil: now }
    );

  
    return res.status(200).send("Đã xử lý webhook");
  } catch (err) {
    console.error("Lỗi xử lý webhook:", err.message);
    return res.status(500).send("Lỗi server");
  }
};


