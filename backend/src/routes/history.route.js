import { Router } from "express";
import { recordListening, getListeningHistory } from "../controller/history.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

router.post("/", recordListening);
router.get("/", getListeningHistory); 

export default router;
