import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";
import { removeVietnameseTones } from "../lib/removeDiacritics.js";

export const getSearchResults = async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ message: "Missing search query" });
  }

  const normalizedQuery = removeVietnameseTones(q.toLowerCase());
  const searchRegex = new RegExp(normalizedQuery, "i");

  try {
    // Lấy full thông tin artist để frontend render
    const matchedArtists = await Artist.find({
      name_normalized: searchRegex,
    }).select("_id name imageUrl"); // 👈 giữ nguyên image và name để hiển thị

    const artistIds = matchedArtists.map((artist) => artist._id);

    const [songs, albums] = await Promise.all([
      Song.find({
        $or: [
          { title_normalized: searchRegex },
          { artist: { $in: artistIds } },
        ],
      })
        .sort({ featured: -1, createdAt: -1 })
        .limit(10)
        .populate("artist", "name"),

      Album.find({
        $or: [
          { title_normalized: searchRegex },
          { artist: { $in: artistIds } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("artist", "name"),
    ]);

    return res.json({ songs, albums, artists: matchedArtists }); // 👈 trả thêm artists
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};
