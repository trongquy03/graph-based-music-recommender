// testWebhook.js
import axios from "axios";

const WEBHOOK_URL = "https://c056-113-23-110-132.ngrok-free.app/api/payment/webhook"; // ⚠️ sửa lại đúng URL

const payload = {
  code: "PAYMENT_SUCCESS",
  data: {
    metadata: {
      userId: "user_2x6UexW8CFqCiNgwXzg2N5EXqUJ",        // ⚠️ Điền đúng clerkId của bạn
      planId: "7days"            // "7days" | "1month" | "1year"
    }
  }
};

async function testWebhook() {
  try {
    const res = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("Webhook sent. Server response:", res.status, res.data);
  } catch (err) {
    console.error("Error sending webhook:", err.response?.data || err.message);
  }
}

testWebhook();
