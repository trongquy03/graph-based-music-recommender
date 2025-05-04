import { Router } from "express";
import { getAllAlbums, getAllAlbumById } from "../controller/album.controller.js";

const router = Router();

router.get('/', getAllAlbums)
router.get('/:albumId', getAllAlbumById)

export default router