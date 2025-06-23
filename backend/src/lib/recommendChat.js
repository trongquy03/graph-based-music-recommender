import { Song } from "../models/song.model.js";
import { Rating } from "../models/rating.model.js";
import { Like } from "../models/like.model.js";

const moodList = ["happy", "sad", "chill", "motivational"];
const genreList = ["pop", "rock", "hiphop", "ballad", "rap", "edm", "rnb", "country", "lofi", "movie"];

function extractMoodGenre(prompt) {
  const lower = prompt.toLowerCase();
  const mood = moodList.find((m) => lower.includes(m));
  const genre = genreList.find((g) => lower.includes(g));
  return { mood, genre };
}

function detectRankingIntent(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes("nhiều like") || lower.includes("được thích nhiều"))
    return { sortBy: "likes" };
  if (lower.includes("nhiều rating") || lower.includes("được đánh giá cao"))
    return { sortBy: "rating" };

  return { sortBy: null };
}

export async function recommendSongs(prompt) {
  const { mood, genre } = extractMoodGenre(prompt);
  const { sortBy } = detectRankingIntent(prompt);

  const query = {};
  if (mood) query.mood = mood;
  if (genre) query.genre = genre;

  try {
    // Nếu có yêu cầu sort theo like/rating
    if (sortBy === "likes") {
      const likedCounts = await Like.aggregate([
        { $group: { _id: "$song", likeCount: { $sum: 1 } } },
        { $sort: { likeCount: -1 } },
        { $limit: 5 },
      ]);

      const ids = likedCounts.map((item) => item._id);
      const songs = await Song.find({ _id: { $in: ids }, ...query })
        .populate("artist", "name")
        .select("title imageUrl audioUrl artist mood genre");

      // Preserve order by mapping again
      const ordered = ids.map((id) => songs.find((s) => s._id.equals(id))).filter(Boolean);

      return ordered.map((song) => ({
        id: song._id,
        title: song.title,
        artist: song.artist.name,
        thumbnail: song.imageUrl,
        audioUrl: song.audioUrl,
      }));
    }

    if (sortBy === "rating") {
      const ratings = await Rating.aggregate([
        {
          $group: {
            _id: "$song",
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgRating: -1, count: -1 } },
        { $limit: 5 },
      ]);

      const ids = ratings.map((item) => item._id);
      const songs = await Song.find({ _id: { $in: ids }, ...query })
        .populate("artist", "name")
        .select("title imageUrl audioUrl artist mood genre");

      const ordered = ids.map((id) => songs.find((s) => s._id.equals(id))).filter(Boolean);

      return ordered.map((song) => ({
        id: song._id,
        title: song.title,
        artist: song.artist.name,
        thumbnail: song.imageUrl,
        audioUrl: song.audioUrl,
      }));
    }

    // Mặc định: lọc theo mood/genre, không sort
    const songs = await Song.find(query)
      .limit(5)
      .populate("artist", "name")
      .select("title imageUrl audioUrl artist mood genre");

    return songs.map((song) => ({
      id: song._id,
      title: song.title,
      artist: song.artist.name,
      thumbnail: song.imageUrl,
      audioUrl: song.audioUrl,
    }));
  } catch (err) {
    console.error("Error in recommendSongs:", err);
    return [];
  }
}
