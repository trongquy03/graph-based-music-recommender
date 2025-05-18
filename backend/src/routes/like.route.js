import { Router } from "express";
import { getLikes, likeSong, unlikeSong } from "../controller/like.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.get('/', getLikes)
router.post("/like", likeSong);
router.post("/unlike", unlikeSong);

export default router