import fetch from "node-fetch";
import { Song } from "../models/song.model.js";
import { askGemini } from "./chat.js";

// 📌 Dùng cho search theo câu lyrics
function parseSrtContent(srtText) {
  return srtText
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const lines = block.trim().split(/\r?\n/);
      return lines.slice(2).join(" ");
    })
    .filter((line) => line);
}

// 📌 Dùng cho tóm tắt lyrics thành đoạn văn
function parseSrtText(srtText) {
  return srtText
    .split(/\r?\n\r?\n/)
    .map((block) => block.split(/\r?\n/).slice(2).join(" "))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ 1. Tìm bài hát theo câu lyrics trong SRT
export async function searchSongsBySrtLyrics(query) {
  const regex = new RegExp(query, "i");
  const songs = await Song.find({ lyricsUrl: { $ne: "" } })
    .limit(30)
    .select("title artist imageUrl audioUrl lyricsUrl")
    .populate("artist", "name");

  const matched = [];

  for (const song of songs) {
    try {
      const res = await fetch(song.lyricsUrl);
      const srtText = await res.text();
      const lines = parseSrtContent(srtText);

      if (lines.some((line) => regex.test(line))) {
        matched.push({
          id: song._id,
          title: song.title,
          artist: song.artist.name,
          thumbnail: song.imageUrl,
          audioUrl: song.audioUrl,
        });

        if (matched.length >= 5) break;
      }
    } catch (err) {
      console.warn(`Không thể đọc lyrics ${song.title}:`, err.message);
    }
  }

  return matched;
}

// Tóm tắt lời bài hát từ .srt
export async function summarizeLyrics(songTitle) {
  const song = await Song.findOne({ title: new RegExp(songTitle, "i") })
    .populate("artist", "name")
    .select("title lyricsUrl imageUrl audioUrl");

  if (!song || !song.lyricsUrl) return null;

  try {
    const res = await fetch(song.lyricsUrl);
    const srt = await res.text();
    const lyricsText = parseSrtText(srt);

    const prompt = `
Hãy tóm tắt nội dung lời bài hát "${song.title}" dưới 100 từ bằng văn phong cảm xúc, rõ ràng.
Lời bài hát:
"""${lyricsText}"""
    `.trim();

    try {
    const summary = await askGemini(prompt);
    return summary;
    } catch (err) {
    console.error("🔥 Gemini failed:", err.message);
    return "Xin lỗi, tôi không thể phân tích lời bài hát lúc này.";
    }


    return {
      song: {
        id: song._id,
        title: song.title,
        artist: song.artist.name,
        imageUrl: song.imageUrl,
        audioUrl: song.audioUrl,
      },
      summary,
    };
  } catch (err) {
    console.error("Error fetching/parsing lyrics:", err.message);
    return null;
  }
}
