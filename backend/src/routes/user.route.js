
import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllUsers, getPremiumStatus } from "../controller/user.controller.js";

const router = Router();

router.get("/",protectRoute, getAllUsers);
router.get("/messages/:userId",protectRoute, getAllUsers);
router.get("/me/premium-status", protectRoute, getPremiumStatus);

export default router