import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { removeVietnameseTones } from "../lib/removeDiacritics.js";

export const getSearchResults = async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ message: "Missing search query" });
  }

  const normalizedQuery = removeVietnameseTones(q.toLowerCase());
  const searchRegex = new RegExp(normalizedQuery, "i");

  try {
    const [songs, albums] = await Promise.all([
      Song.find({
        $or: [
          { title_normalized: searchRegex },
          { artist_normalized: searchRegex },
        ],
      })
        .sort({ featured: -1, createdAt: -1 })
        .limit(10),

      Album.find({
        $or: [
          { title_normalized: searchRegex },
          { artist_normalized: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.json({ songs, albums });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};
