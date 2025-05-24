import { Artist } from "../models/artist.model.js";
import { User } from "../models/user.model.js";

// Get all artists
export const getAllArtists = async (req, res, next) => {
  try {
    const artists = await Artist.find().sort({ name: 1 });
    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    next(error);
  }
};

// Get artist by ID
export const getArtistById = async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    res.status(200).json(artist);
  } catch (error) {
    console.error("Error fetching artist:", error);
    next(error);
  }
};

// Follow Artist
export const followArtist = async (req, res) => {
  const { artistId } = req.params;
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const artist = await Artist.findByIdAndUpdate(
      artistId,
      { $addToSet: { followers: userId } },
      { new: true }
    );
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $addToSet: { followedArtists: artist._id } }
    );

    return res.status(200).json({ message: "Followed artist", artist });
  } catch (error) {
    console.error("Error following artist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unfollow Artist
export const unfollowArtist = async (req, res) => {
  const { artistId } = req.params;
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const artist = await Artist.findByIdAndUpdate(
      artistId,
      { $pull: { followers: userId } },
      { new: true }
    );
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { followedArtists: artist._id } }
    );

    return res.status(200).json({ message: "Unfollowed artist", artist });
  } catch (error) {
    console.error("Error unfollowing artist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get followers count
export const getArtistFollowersCount = async (req, res) => {
  const { artistId } = req.params;

  try {
    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    return res.status(200).json({ followers: artist.followers.length });
  } catch (error) {
    console.error("Error getting followers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if current user is following the artist
export const isFollowingArtist = async (req, res) => {
  const { artistId } = req.params;
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const isFollowing = artist.followers.includes(userId);
    return res.status(200).json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all artists the user is following
export const getFollowedArtists = async (req, res) => {
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId }).populate("followedArtists");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ artists: user.followedArtists });
  } catch (error) {
    console.error("Error fetching followed artists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFollowedArtistsCount = async (req, res) => {
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ count: user.followedArtists.length });
  } catch (error) {
    console.error("Error getting followed artist count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

