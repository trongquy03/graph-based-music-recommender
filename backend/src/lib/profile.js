import { ListeningHistory } from "../models/listeningHistory.model.js";
import { User } from "../models/user.model.js";
import { askGemini } from "./chat.js";

export async function analyzeUserMusicProfile(clerkId) {
  const history = await ListeningHistory.find({ user: clerkId })
    .sort({ listenedAt: -1 })
    .limit(200)
    .populate("song");

  if (!history.length) {
    return "🎧 Bạn chưa nghe đủ bài để phân tích gu âm nhạc.";
  }

  const moodStats = {};
  const genreStats = {};
  const timeStats = {};

  for (const entry of history) {
    const song = entry.song;
    if (!song || !song.mood || !song.genre) continue;

    moodStats[song.mood] = (moodStats[song.mood] || 0) + 1;
    genreStats[song.genre] = (genreStats[song.genre] || 0) + 1;

    const hour = new Date(entry.listenedAt).getHours();
    const timeKey =
      hour < 6 ? "đêm" : hour < 12 ? "sáng" : hour < 18 ? "chiều" : "tối";
    timeStats[timeKey] = (timeStats[timeKey] || 0) + 1;
  }

  const user = await User.findOne({ clerkId });

  const prompt = `
Bạn là chuyên gia phân tích tâm lý âm nhạc. Dựa vào dữ liệu dưới đây, hãy mô tả gu âm nhạc của người dùng dưới 100 từ:

- Mood nghe nhiều: ${JSON.stringify(moodStats)}
- Thể loại yêu thích: ${JSON.stringify(genreStats)}
- Thời điểm nghe nhạc trong ngày: ${JSON.stringify(timeStats)}
- Tài khoản Premium: ${user?.isPremium ? "Có" : "Không"}
`;

  try {
    const reply = await askGemini(prompt);
    return reply;
  } catch (err) {
    console.error("🔥 Gemini fail:", err.message);
    return "⚠️ Không thể phân tích gu âm nhạc lúc này.";
  }
}
