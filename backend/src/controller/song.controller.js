import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { neo4jLocal  } from "../lib/db.js";

export const getAllSongs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, artist } = req.query; 

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
        isPremium: 1,
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
          isPremium: 1,
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

// export const getMadeForYouSongs = async (req, res, next) => {
//   const userId = req.auth?.userId || req.query.user; 
//   if (!userId) return res.status(401).json({ message: "Unauthorized" });

//   const session = neo4jDriver.session(); 

//   try {
//     const result = await session.run(
//       `MATCH (u:User {id: $userId})-[:LISTENED|LIKES|RATED]->(s:Song)<-[:LISTENED|LIKES|RATED]-(other:User)
//        MATCH (other)-[:LISTENED|LIKES|RATED]->(rec:Song)
//        WHERE NOT (u)-[:LIKES|RATED]->(rec)
//        RETURN DISTINCT rec.id AS songId
//        LIMIT 15`,
//       { userId }
//     );

//     const songIds = result.records.map((r) => r.get("songId"));
//     const songs = await Song.find({ _id: { $in: songIds.map(id => new mongoose.Types.ObjectId(id)) } })
//       .select("title artist imageUrl audioUrl lyricsUrl isPremium") 
//       .populate("artist", "name");


//     const sorted = songIds.map(id => songs.find(s => s._id.toString() === id)).filter(Boolean);

//     res.status(200).json(sorted);
//   } catch (error) {
//     console.error("Graph recommendation error:", error);
//     res.status(500).json({ message: "Failed to get recommendations" });
//   } finally {
//     await session.close(); 
//   }
// };

export const getMadeForYouSongs = async (req, res) => {
  const session = neo4jLocal.session();

  try {
    const userResult = await session.run(`
      MATCH (u:User)
      WITH u ORDER BY rand()
      LIMIT 1
      RETURN u.id AS userId
    `);

    const neo4jUserId = userResult.records[0]?.get("userId");
    if (!neo4jUserId) {
      return res.status(404).json({ message: "Không tìm thấy user Neo4j" });
    }

    const recommendationsResult = await session.run(`
      MATCH (u:User {id: $neo4jUserId})-[:RECOMMENDED]->(s:Song)
      RETURN s.title AS title
    `, { neo4jUserId });

    const recommendedTitles = recommendationsResult.records.map(r => r.get("title"));
    if (!recommendedTitles.length) return res.status(200).json([]);

    const allSongs = await Song.find()
    .select("_id title imageUrl audioUrl lyricsUrl isPremium artist")
    .populate("artist", "name");

    // Tránh trùng lặp audioUrl
    const usedAudioUrls = new Set();
    const madeForYou = [];

    const usedSongIds = new Set();

    for (const title of recommendedTitles) {
      const candidates = allSongs.filter(song => !usedSongIds.has(song._id));
      if (candidates.length === 0) break;

      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      usedSongIds.add(picked._id);

      madeForYou.push({
        _id: picked._id,  // <<< RẤT QUAN TRỌNG
        title,
        imageUrl: picked.imageUrl,
        audioUrl: picked.audioUrl,
        lyricsUrl: picked.lyricsUrl,
        isPremium: picked.isPremium,
        artist: picked.artist,
      });
    }


    return res.status(200).json(madeForYou);
  } catch (error) {
    console.error("getMadeForYouSongs error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Lỗi lấy gợi ý" });
    }
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
          isPremium: 1,
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

export const streamSong = async (req, res) => {
  const userId = req.auth.userId;
  const { id: songId } = req.params;

  try {
    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: "Không tìm thấy bài hát." });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(401).json({ message: "Người dùng không tồn tại." });

    // Nếu user từng là Premium nhưng đã hết hạn
    if (user.isPremium && user.premiumUntil && new Date(user.premiumUntil) < new Date()) {
      user.isPremium = false;
      user.subscriptionType = "free";
      await user.save();
    }

    // Nếu bài hát yêu cầu Premium và user không phải Premium
    if (song.isPremium && !user.isPremium) {
      return res.status(403).json({ message: "Bài hát này yêu cầu tài khoản Premium." });
    }

    // Nếu user không Premium => trả preview + quảng cáo
    if (!user.isPremium) {
      return res.json({
        previewUrl: song.audioUrl,
        showAds: true,
        adAudioUrl: "/songs/ads.mp3",
      });
    }

    // Nếu là Premium
    return res.json({
      fullAudioUrl: song.audioUrl,
      isPremium: song.isPremium,
      isUserPremium: user.isPremium,
    });


  } catch (err) {
    console.error("Lỗi streamSong:", err.message);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};