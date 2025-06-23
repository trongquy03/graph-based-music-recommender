import { askGemini } from "../lib/chat.js";
import { recommendSongs } from "../lib/recommendChat.js";
import { searchSongsBySrtLyrics, summarizeLyrics } from "../lib/lyricChatAi.js";
import { createPlaylistFromPrompt } from "../lib/playlist.js";
import { analyzeUserMusicProfile } from "../lib/profile.js";

export const aiChat = async (req, res, next) => {
  const { prompt, history = [] } = req.body;
  const clerkId = req.auth?.userId || req.user?.clerkId;

  if (!prompt || !clerkId) {
    return res.status(400).json({ error: "Missing prompt or userId" });
  }

  try {
    let songs = [];
    let playlist = null;

    // ✅ Giai đoạn 7: phân tích gu nhạc
    if (
      prompt.toLowerCase().includes("gu âm nhạc") ||
      prompt.toLowerCase().includes("tính cách") ||
      prompt.toLowerCase().includes("nghe gì nhiều")
    ) {
      const profile = await analyzeUserMusicProfile(clerkId);
      return res.json({ reply: profile, songs: [], playlist: null });
    }

    // ✅ Giai đoạn 5: tóm tắt lời bài hát
    if (
      prompt.toLowerCase().includes("tóm tắt") &&
      prompt.toLowerCase().includes("bài")
    ) {
      const titleMatch = prompt.match(/bài\s+(.*?)($|nói|viết|tên|lời|tóm)/i)?.[1];
      if (titleMatch) {
        const result = await summarizeLyrics(titleMatch);
        if (result) {
          return res.json({
            reply: `🎵 Đây là tóm tắt bài *${result.song.title}*: ${result.summary}`,
            songs: [result.song],
            playlist: null,
          });
        }
      }
    }

    // ✅ Giai đoạn 4: tìm bài từ câu lyrics
    const lyricMatch = prompt.match(/["“](.+?)["”]/)?.[1];
    if (
      lyricMatch &&
      (prompt.toLowerCase().includes("câu hát") ||
        prompt.toLowerCase().includes("lời bài hát"))
    ) {
      songs = await searchSongsBySrtLyrics(lyricMatch);
    } else {
      songs = await recommendSongs(prompt);
    }

    // ✅ Giai đoạn 3: tạo playlist
    if (songs.length >= 3 && prompt.toLowerCase().includes("playlist")) {
      playlist = await createPlaylistFromPrompt(clerkId, prompt, songs);
    }

    // ✅ Cuối cùng mới gọi Gemini nếu không khớp các case trên
    const reply = await askGemini(prompt, history);

    res.json({ reply, songs, playlist });
  } catch (error) {
    console.error("🔥 AI Chat Lỗi:", error.message);
    res.status(500).json({ error: "Lỗi khi xử lý yêu cầu AI" });
  }
};
