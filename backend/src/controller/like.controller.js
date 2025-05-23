
import { Like } from "../models/like.model.js";

export const getLikes = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const likes = await Like.find({ user: userId })
            .populate({
                path: "song",
                populate: { path: "artist", select: "name" },
            });
        res.status(200).json(likes);
    } catch (error) {
        next(error);
    }
};


export const likeSong = async (req, res) => {
    const userId = req.auth.userId;
    const { songId } = req.body;

    try {
        const existingLike = await Like.findOne({ user: userId, song: songId });

        if (existingLike) {
            return res.status(400).json({ message: "You already liked this song." });
        }

        const like = new Like({ user: userId, song: songId });
        await like.save();

        res.status(201).json({ message: "Song liked successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const unlikeSong = async (req, res) => {
    const userId = req.auth.userId;
    const { songId } = req.body;

    try {
        await Like.findOneAndDelete({ user: userId, song: songId });
        res.status(200).json({ message: "Song unliked successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getSongLikeCount = async (req, res) => {
  const { songId } = req.params;

  try {
    const likeCount = await Like.countDocuments({ song: songId });
    res.status(200).json({ songId, likeCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
