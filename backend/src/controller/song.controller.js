import { Song } from "../models/song.model.js";
import mongoose from "mongoose";
import { neo4jSession } from "../lib/db.js";

export const getAllSongs = async (req, res, next) => {
  try {
    const songs = await Song.find()
      .sort({ createdAt: -1 })
      .populate("artist", "name");
    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      { $sample: { size: 6 } },
      {
        $lookup: {
          from: "artists",
          localField: "artist",
          foreignField: "_id",
          as: "artist"
        }
      },
      { $unwind: "$artist" },
      {
        $project: {
          _id: 1,
          title: 1,
          imageUrl: 1,
          audioUrl: 1,
          artist: {
            _id: "$artist._id",
            name: "$artist.name",
            // imageUrl: "$artist.imageUrl" 
          }
        }
      }

    ]);
    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getMadeForYouSongs = async (req, res, next) => {
  const userId = req.auth?.userId || req.query.user; 
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const result = await neo4jSession.run(
      `MATCH (u:User {id: $userId})-[:LISTENED|LIKES|RATED]->(s:Song)<-[:LISTENED|LIKES|RATED]-(other:User)
       MATCH (other)-[:LISTENED|LIKES|RATED]->(rec:Song)
       WHERE NOT (u)-[:LISTENED|LIKES|RATED]->(rec)
       RETURN DISTINCT rec.id AS songId
       LIMIT 15`,
      { userId }
    );

    const songIds = result.records.map((r) => r.get("songId"));
    const songs = await Song.find({ _id: { $in: songIds.map(id => new mongoose.Types.ObjectId(id)) } })
                            .populate("artist");

    // giữ đúng thứ tự như kết quả query neo4j
    const sorted = songIds.map(id => songs.find(s => s._id.toString() === id)).filter(Boolean);

    res.status(200).json(sorted);
  } catch (error) {
    console.error("Graph recommendation error:", error);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
};

export const getTrendingSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      { $sample: { size: 15 } },
      {
        $lookup: {
          from: "artists",
          localField: "artist",
          foreignField: "_id",
          as: "artist"
        }
      },
      { $unwind: "$artist" },
      {
        $project: {
          _id: 1,
          title: 1,
          imageUrl: 1,
          audioUrl: 1,
          artist: {
            _id: "$artist._id",
            name: "$artist.name",
            // imageUrl: "$artist.imageUrl" 
          }
        }
      }
    ]);
    res.json(songs);
  } catch (error) {
    next(error);
  }
};