import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import fs from "fs";
import { uploadToCloudinary } from "../lib/cloudinary.js";
import { neo4jDriver  } from "../lib/db.js";
import { splitAudioWithSpleeter } from "../lib/splitAudio.js";
import { downloadFileToTemp } from "../lib/download.js";

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
        youtubeUrl: 1,
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
          youtubeUrl: 1,
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
export const getSimilarSongsById = async (req, res, next) => {
  const { id } = req.params;
  const session = neo4jDriver.session();

  try {
    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ message: "Không tìm thấy bài hát" });

    const mongoId = song._id.toString();

    const result = await session.run(`
      MATCH (:Song {id: $id})-[:SIMILAR_TO]->(other:Song)
      RETURN other.id AS id
      LIMIT 6
    `, { id: mongoId });

    const similarIds = result.records.map(r => r.get("id"));

    if (!similarIds.length) return res.status(200).json([]);

    // 2. Truy vấn MongoDB theo _id
    const songs = await Song.find({ _id: { $in: similarIds } })
      .select("_id title imageUrl audioUrl lyricsUrl youtubeUrl isPremium artist")
      .populate("artist", "name");

    return res.status(200).json(songs);
  } catch (error) {
    console.error("getSimilarSongsById error:", error.message);
    return res.status(500).json({ message: "Lỗi lấy bài hát tương tự" });
  } finally {
    await session.close();
  }
};


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
    .select("_id title imageUrl audioUrl lyricsUrl isPremium youtubeUrl artist")
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
        _id: picked._id, 
        title,
        imageUrl: picked.imageUrl,
        audioUrl: picked.audioUrl,
        lyricsUrl: picked.lyricsUrl,
        youtubeUrl: picked.youtubeUrl,
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
export const recommendSongs = async (req, res) => {
  const userId = req.auth?.userId;
  const session = neo4jDriver.session();
   if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    // STEP 1: Lấy 5 bài user tương tác mạnh nhất
    const interactionQuery = `
     CALL {
        MATCH (u:User {id: $userId})-[r:LISTENED_TO]->(s:Song)
        WHERE r.timestamp IS NOT NULL
        WITH s.id AS songId,
            2.0 / (1 + duration.inDays(r.timestamp, datetime()).days) AS score
        RETURN songId, score
        UNION
        MATCH (u:User {id: $userId})-[r:LIKES]->(s:Song)
        WHERE r.timestamp IS NOT NULL
        WITH s.id AS songId,
            4.0 / (1 + duration.inDays(r.timestamp, datetime()).days) AS score
        RETURN songId, score
        UNION
        MATCH (u:User {id: $userId})-[r:RATED]->(s:Song)
        WHERE r.timestamp IS NOT NULL
        WITH s.id AS songId,
            r.rating / (1 + duration.inDays(r.timestamp, datetime()).days) AS score
        RETURN songId, score
      }
      WITH songId, sum(score) AS totalScore
      ORDER BY totalScore DESC
      LIMIT 5
      RETURN songId
    `;
    const interactionResult = await session.run(interactionQuery, { userId });
    const baseSongs = interactionResult.records.map(r => r.get('songId'));

    // STEP 2: Nếu không có tương tác → fallback bằng PageRank toàn đồ thị
    if (baseSongs.length === 0) {
      const fallbackQuery = `
        CALL gds.pageRank.stream('song-graph')
        YIELD nodeId, score
        RETURN gds.util.asNode(nodeId).id AS songId, score
        ORDER BY score DESC
        LIMIT 9
      `;
      const fallbackResult = await session.run(fallbackQuery);
      const fallbackIds = fallbackResult.records.map(r => r.get('songId'));

      const songs = await Song.find({ _id: { $in: fallbackIds } })
        .select('_id title imageUrl audioUrl lyricsUrl youtubeUrl isPremium artist')
        .populate('artist', 'name');

      return res.json({ type: 'fallback', songs });
    }

    // STEP 3: Lấy bài tương tự từ SIMILAR_TO
    const similarQuery = `
      UNWIND $baseSongs AS bs
      MATCH (:Song {id: bs})-[:SIMILAR_TO]->(rec:Song)
      WHERE NOT rec.id IN $baseSongs
      RETURN DISTINCT rec.id AS candidate
      LIMIT 50
    `;
    const similarResult = await session.run(similarQuery, { baseSongs });
    const candidateIds = similarResult.records.map(r => r.get('candidate'));

    if (candidateIds.length === 0) {
      return res.json({ type: 'similarity-empty', songs: [] });
    }

    // STEP 4: Chạy PageRank để sắp xếp lại các bài tương tự
   const pageRankQuery = `
      CALL gds.pageRank.stream('song-graph')
      YIELD nodeId, score
      WITH gds.util.asNode(nodeId).id AS songId, score
      WHERE songId IN $candidates
      RETURN songId, score
      ORDER BY score DESC
      LIMIT 9
    `;

    const rankedResult = await session.run(pageRankQuery, {
      candidates: candidateIds
    });
    const topSongIds = rankedResult.records.map(r => r.get('songId'));

    // STEP 5: Truy vấn MongoDB để lấy thông tin bài hát
    const songs = await Song.find({ _id: { $in: topSongIds } })
      .select('_id title imageUrl audioUrl lyricsUrl youtubeUrl isPremium artist')
      .populate('artist', 'name');

    return res.json({ type: 'personalized', songs });
  } catch (err) {
    console.error(' Recommendation error:', err);
    res.status(500).json({ message: 'Lỗi gợi ý bài hát' });
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
          youtubeUrl: 1,
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

export const getSongById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id).populate("artist", "name");
    if (!song) {
      return res.status(404).json({ message: "Không tìm thấy bài hát" });
    }

    res.status(200).json({
      _id: song._id,
      title: song.title,
      imageUrl: song.imageUrl,
      audioUrl: song.audioUrl,
      lyricsUrl: song.lyricsUrl,
      youtubeUrl: song.youtubeUrl,
      isPremium: song.isPremium,
      tags: song.tags || [], // ✅ TRẢ VỀ TAGS
      artist: song.artist
        ? { _id: song.artist._id, name: song.artist.name }
        : null,
    });
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

export const createKaraokeForSong = async (req, res) => {
  const { id } = req.params;

  try {
    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ error: 'Không tìm thấy bài hát' });

    if (song.karaokeUrl) {
      return res.status(200).json({ message: 'Đã có karaoke sẵn', karaokeUrl: song.karaokeUrl });
    }

    // 1. Download audio file
    const tempInputPath = await downloadFileToTemp(song.audioUrl);

    // 2. Tách vocal → tạo accompaniment.wav và convert sang .mp3
    const { mp3Path, wavPath } = await splitAudioWithSpleeter(tempInputPath, 'outputs');

    // 3. Upload accompaniment.mp3 lên Cloudinary
    const uploadRes = await uploadToCloudinary(mp3Path, 'karaoke');

    // 4. Lưu karaokeUrl vào DB
    song.karaokeUrl = uploadRes.secure_url;
    await song.save();

    // 5. Cleanup file tạm
    [tempInputPath, mp3Path, wavPath].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    res.status(200).json({
      message: 'Đã tạo karaoke thành công',
      karaokeUrl: song.karaokeUrl,
    });
  } catch (err) {
    console.error('Lỗi khi tạo karaoke:', err);
    res.status(500).json({ error: 'Lỗi nội bộ khi xử lý karaoke' });
  }
};