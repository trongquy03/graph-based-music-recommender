import { Song } from "../models/song.model.js";
import { Artist } from "../models/artist.model.js";

const guessGenre = (title) => {
  const t = title.toLowerCase();
  if (t.includes("rap")) return "rap";
  if (t.includes("remix") || t.includes("dj")) return "edm";
  if (t.includes("ballad")) return "ballad";
  if (t.includes("lofi")) return "lofi";
  if (t.includes("rnb")) return "rnb";
  if (t.includes("pop")) return "pop";
  if (t.includes("rock")) return "rock";
  return "pop";
};

const guessMood = (title) => {
  const t = title.toLowerCase();
  if (t.includes("sad") || t.includes("buồn")) return "sad";
  if (t.includes("happy") || t.includes("vui")) return "happy";
  if (t.includes("chill") || t.includes("thư giãn")) return "chill";
  if (t.includes("motivation") || t.includes("năng lượng")) return "motivational";
  return "chill";
};

export const saveWhisperResult = async (req, res) => {
  try {
    const {
      video_id,
      title,
      audio_url,
      image_url,
      transcript,
      uploader,
      channel_thumbnail
    } = req.body;

    if (!video_id || !transcript || !title || !audio_url) {
      return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc." });
    }

    // Tạo hoặc tìm Artist
    let artist = await Artist.findOne({ name: uploader });
    if (!artist) {
      artist = await Artist.create({
        name: uploader,
        imageUrl: channel_thumbnail,
        name_normalized: uploader.toLowerCase(),
        bio: "Tạo tự động từ YouTube"
      });
    }

    // Tạo hoặc cập nhật Song
    let song = await Song.findOne({ youtubeId: video_id });

    if (!song) {
      song = await Song.create({
        youtubeId: video_id,
        title,
        audioUrl: audio_url,
        imageUrl: image_url,
        artist: artist._id,
        transcript,
        genre: guessGenre(title),
        mood: guessMood(title),
        title_normalized: title.toLowerCase(),
        duration: transcript[transcript.length - 1]?.end || 60
      });
    } else {
      song.title = title;
      song.audioUrl = audio_url;
      song.imageUrl = image_url;
      song.transcript = transcript;
      song.artist = artist._id;
      song.genre = guessGenre(title);
      song.mood = guessMood(title);
      await song.save();
    }

    res.status(200).json({ message: "✅ Đã lưu bài hát", songId: song._id });
  } catch (err) {
    console.error("Lỗi khi lưu dữ liệu từ Colab:", err);
    res.status(500).json({ error: "Lỗi server khi lưu dữ liệu." });
  }
};
