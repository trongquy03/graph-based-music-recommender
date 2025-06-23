import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { Artist } from "../models/artist.model.js";
// Hàm chuẩn hóa tiếng Việt
const removeVietnameseTones = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

const normalize = (text) => removeVietnameseTones(text.toLowerCase().trim());

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/music_db");
  console.log("✅ Kết nối MongoDB thành công");

  const songs = await Song.find().populate("artist");
  let updated = 0;

  for (const s of songs) {
    s.title_normalized = normalize(s.title);
    if (s.artist?.name) s.artist_normalized = normalize(s.artist.name);

    try {
      await s.save();
      updated++;
    } catch (err) {
      console.warn(`⚠️ Bỏ qua song lỗi: ${s.title} - ${err.message}`);
    }
  }

  console.log(`🎵 Đã cập nhật ${updated} bài hát`);
  await mongoose.disconnect();
  console.log("✅ Hoàn tất.");
};

run().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
