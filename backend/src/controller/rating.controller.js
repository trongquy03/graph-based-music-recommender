import { Rating } from "../models/rating.model.js";
import mongoose from "mongoose";
import { neo4jSession } from "../lib/db.js";

// Get all ratings by current user
export const getRatings = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const ratings = await Rating.find({ user: userId }).populate({
                path: "song",
                populate: { path: "artist", select: "name" },
            });
    res.status(200).json(ratings);
  } catch (err) {
    next(err);
  }
};

// Rate, update, or delete (if rating = 0)
export const rateSong = async (req, res) => {
  const userId = req.auth.userId;
  const { songId, rating } = req.body;

  if (!songId || rating === undefined) {
    return res.status(400).json({ message: "songId and rating are required." });
  }

  if (!mongoose.Types.ObjectId.isValid(songId)) {
    return res.status(400).json({ message: "Invalid song ID" });
  }

  try {
    if (rating === 0) {
      await Rating.findOneAndDelete({ user: userId, song: songId });

       // Xoá quan hệ RATED trong Neo4j
      await neo4jSession.run(
        `MATCH (u:User {id: $userId})-[r:RATED]->(s:Song {id: $songId}) DELETE r`,
        { userId, songId }
      );

      return res.status(200).json({ message: "Rating cleared." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const existing = await Rating.findOne({ user: userId, song: songId });

    if (existing) {
      existing.rating = rating;
      await existing.save();

       // Cập nhật quan hệ RATED
      await neo4jSession.run(
        `MERGE (u:User {id: $userId})
         MERGE (s:Song {id: $songId})
         MERGE (u)-[r:RATED]->(s)
         SET r.rating = $rating`,
        { userId, songId, rating }
      );

      return res.status(200).json({ message: "Rating updated." });
    }

    const newRating = new Rating({ user: userId, song: songId, rating });
    await newRating.save();

    // Tạo quan hệ RATED mới trong Neo4j
    await neo4jSession.run(
      `MERGE (u:User {id: $userId})
       MERGE (s:Song {id: $songId})
       MERGE (u)-[r:RATED]->(s)
       SET r.rating = $rating`,
      { userId, songId, rating }
    );

    res.status(201).json({ message: "Song rated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get average rating for a song
export const getAverageRating = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid song ID" });
  }

  try {
    const result = await Rating.aggregate([
      { $match: { song: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$song",
          average: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json({ average: 0, totalRatings: 0 });
    }

    const { average, totalRatings } = result[0];
    res.status(200).json({ average, totalRatings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Explicit delete rating if needed
export const deleteRating = async (req, res) => {
  const userId = req.auth.userId;
  const { songId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(songId)) {
    return res.status(400).json({ message: "Invalid song ID" });
  }

  try {
    await Rating.findOneAndDelete({ user: userId, song: songId });

     await neo4jSession.run(
      `MATCH (u:User {id: $userId})-[r:RATED]->(s:Song {id: $songId}) DELETE r`,
      { userId, songId }
    );
    res.status(200).json({ message: "Rating deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
