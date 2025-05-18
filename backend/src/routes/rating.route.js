import { Router } from "express";
import { getRatings, rateSong } from "../controller/rating.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);


router.get("/", getRatings); 
router.post("/", rateSong);  
export default router