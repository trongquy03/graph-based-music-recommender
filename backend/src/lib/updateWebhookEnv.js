import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels";
const envPath = path.resolve(process.cwd(), ".env");

dotenv.config();

async function updateWebhookUrl() {
  try {
    const res = await axios.get(NGROK_API_URL);
    const tunnels = res.data.tunnels;

    if (!tunnels.length) {
      console.error("Không tìm thấy tunnel nào từ ngrok.");
      return;
    }

    const httpsTunnel = tunnels.find(t => t.public_url.startsWith("https"));
    if (!httpsTunnel) {
      console.error("Không có HTTPS tunnel.");
      return;
    }

    const webhookUrl = `${httpsTunnel.public_url}/api/payment/webhook`;
    console.log("🌐 Webhook URL mới:", webhookUrl);

    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    const updatedEnv = envContent.match(/^WEBHOOK_URL=/m)
      ? envContent.replace(/^WEBHOOK_URL=.*/m, `WEBHOOK_URL=${webhookUrl}`)
      : envContent + `\nWEBHOOK_URL=${webhookUrl}`;

    fs.writeFileSync(envPath, updatedEnv.trim() + "\n", "utf-8");
    console.log("✅ Đã cập nhật WEBHOOK_URL trong .env");
  } catch (err) {
    console.error(" Lỗi:", err.message);
  }
}

updateWebhookUrl();
