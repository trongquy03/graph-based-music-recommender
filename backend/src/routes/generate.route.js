import { Router } from "express";
import { saveWhisperResult } from "../controller/generate.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", saveWhisperResult);

export default router