import { Song } from "../models/song.model.js";
import mongoose from "mongoose";
import { neo4jDriver } from "../lib/db.js";

export const getAllSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, artist } = req.query; // 👈 nếu có truyền artist filter

    const pipeline = [];

    pipeline.push({
      $lookup: {
        from: "artists",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
      },
    });

    pipeline.push({ $unwind: "$artist" });

 
    const match = {};
    if (search) {
      match.$or = [
        { title: { $regex: search, $options: "i" } },
        { "artist.name": { $regex: search, $options: "i" } },
      ];
    }
    if (artist && mongoose.Types.ObjectId.isValid(artist)) {
      match["artist._id"] = new mongoose.Types.ObjectId(artist);
    }
    if (Object.keys(match).length) pipeline.push({ $match: match });

    // Tổng số
    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Song.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Phân trang
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        imageUrl: 1,
        audioUrl: 1,
        lyricsUrl: 1,
        createdAt: 1,
        artist: {
          _id: "$artist._id",
          name: "$artist.name",
        },
      },
    });

    const songs = await Song.aggregate(pipeline);

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: songs,
    });
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
          lyricsUrl: 1,
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

  const session = neo4jDriver.session(); 

  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:LISTENED|LIKES|RATED]->(s:Song)<-[:LISTENED|LIKES|RATED]-(other:User)
       MATCH (other)-[:LISTENED|LIKES|RATED]->(rec:Song)
       WHERE NOT (u)-[:LIKES|RATED]->(rec)
       RETURN DISTINCT rec.id AS songId
       LIMIT 15`,
      { userId }
    );

    const songIds = result.records.map((r) => r.get("songId"));
    const songs = await Song.find({ _id: { $in: songIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .select("title artist imageUrl audioUrl lyricsUrl") 
      .populate("artist", "name");


    const sorted = songIds.map(id => songs.find(s => s._id.toString() === id)).filter(Boolean);

    res.status(200).json(sorted);
  } catch (error) {
    console.error("Graph recommendation error:", error);
    res.status(500).json({ message: "Failed to get recommendations" });
  } finally {
    await session.close(); 
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
          lyricsUrl: 1,
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