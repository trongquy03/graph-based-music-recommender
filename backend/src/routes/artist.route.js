import { Router } from "express";
import { getAllArtists, getArtistById, followArtist, unfollowArtist, getArtistFollowersCount, isFollowingArtist, getFollowedArtists, getFollowedArtistsCount } from "../controller/artist.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = Router();

router.get("/", getAllArtists);
router.get("/me/following", protectRoute, getFollowedArtists);
router.get("/me/following/count", protectRoute, getFollowedArtistsCount );
router.get("/:artistId/followers/count", getArtistFollowersCount);
router.get("/:artistId/is-following", protectRoute, isFollowingArtist);
router.post("/:artistId/follow", protectRoute, followArtist);
router.post("/:artistId/unfollow", protectRoute, unfollowArtist);


router.get("/:artistId", getArtistById);

export default router