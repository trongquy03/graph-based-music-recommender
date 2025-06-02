import { Router } from "express";
import { getRatings, rateSong, getAverageRating, deleteRating } from "../controller/rating.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();



router.get("/average/:id", getAverageRating);

router.post("/",protectRoute, rateSong);
router.delete("/",protectRoute, deleteRating);

router.get("/",protectRoute, getRatings);
export default router