import express from "express";
import {
  createPlaylist,
  getUserPlaylists,
  addSongToPlaylist,
  deletePlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  getPublicPlaylists,
  getPublicPlaylistById,
  updatePlaylist,
  getPlaylistById
} from "../controller/playlist.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);


router.post("/", createPlaylist);
router.get("/", getUserPlaylists);
router.post("/add-song", addSongToPlaylist);
router.delete("/:playlistId", deletePlaylist);
router.post("/remove-song", removeSongFromPlaylist);
router.post("/reorder", reorderPlaylistSongs);
router.get("/public", getPublicPlaylists);
router.get("/public/:playlistId", getPublicPlaylistById);
router.put("/:id",  updatePlaylist);
router.get("/:id",  getPlaylistById);




export default router;
