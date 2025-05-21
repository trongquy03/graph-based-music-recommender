import { Router } from "express";
import { getRatings, rateSong, getAverageRating, deleteRating } from "../controller/rating.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);


router.get("/average/:id", getAverageRating);

router.post("/", rateSong);
router.delete("/", deleteRating);

router.get("/", getRatings);
export default router