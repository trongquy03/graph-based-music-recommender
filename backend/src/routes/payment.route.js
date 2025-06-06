import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPayment, payosWebhook } from "../controller/payment.controller.js";

const router = Router();


router.post("/create-payment", protectRoute, createPayment);
router.post("/webhook", payosWebhook);

export default router