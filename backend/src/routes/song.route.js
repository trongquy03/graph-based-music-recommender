import { Router } from "express";
import { getAllSongs, getFeaturedSongs, getMadeForYouSongs, getTrendingSongs, streamSong } from "../controller/song.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.get('/' ,getAllSongs)
router.get("/songs/:id/stream", protectRoute, streamSong);
router.get('/featured',getFeaturedSongs)
router.get('/made-for-you',getMadeForYouSongs)
router.get('/trending',getTrendingSongs)

export default router