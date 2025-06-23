import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { aiChat } from "../controller/aichat.controller.js";

const router = Router();

router.post("/", protectRoute, aiChat);

export default router