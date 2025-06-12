
import { Like } from "../models/like.model.js";
import { getAuraSession } from "../lib/db.js";


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
    const session = getAuraSession();
    const userId = req.auth.userId;
    const { songId } = req.body;

    try {
        const existingLike = await Like.findOne({ user: userId, song: songId });

        if (existingLike) {
            return res.status(400).json({ message: "You already liked this song." });
        }

        const like = new Like({ user: userId, song: songId });
        await like.save();
            await session.run(
            `MERGE (u:User {id: $userId})
            MERGE (s:Song {id: $songId})
            MERGE (u)-[:LIKES]->(s)`,
            { userId, songId }
        );

        res.status(201).json({ message: "Song liked successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
};

export const unlikeSong = async (req, res) => {
    const session = getAuraSession();
    const userId = req.auth.userId;
    const { songId } = req.body;

    try {
        await Like.findOneAndDelete({ user: userId, song: songId });

        await session.run(
            `MATCH (u:User {id: $userId})-[r:LIKES]->(s:Song {id: $songId})
            DELETE r`,
            { userId, songId }
        )
        res.status(200).json({ message: "Song unliked successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
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
