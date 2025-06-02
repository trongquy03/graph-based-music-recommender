import { Router } from "express";
import { createSong, deleteSong, createAlbum, 
    generateLyricsForSong, uploadLyricsManually, deleteAlbum, checkAdmin, createArtist, deleteArtist, updateArtist, updateSong, updateAlbum } from "../controller/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute, requireAdmin)

router.get('/check', checkAdmin)
router.post("/songs/:id/generate-lyrics", generateLyricsForSong);
router.put("/songs/:id/lyrics/manual", uploadLyricsManually);


router.post('/artists', createArtist)
router.delete('/artists/:id', deleteArtist)
router.put('/artists/:id', updateArtist)

router.post('/songs', createSong)
router.delete('/songs/:id', deleteSong)
router.put('/songs/:id', updateSong)

router.post('/albums', createAlbum)
router.delete('/albums/:id', deleteAlbum)
router.put('/albums/:id', updateAlbum)

export default router