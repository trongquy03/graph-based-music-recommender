import { Router } from "express";
import { getUploadSignature } from "../controller/cloudinary.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";
const router = Router();
router.use(protectRoute, requireAdmin)

router.get("/signature", getUploadSignature);
export default router;
