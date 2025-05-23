import { Router } from "express";
import { getAllArtists, getArtistById } from "../controller/artist.controller.js";

const router = Router();

router.get('/', getAllArtists)
router.get('/:artistId', getArtistById)

export default router