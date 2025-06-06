import mongoose from "mongoose";
import dotenv from "dotenv";
import { Song } from "../models/song.model.js"; // đường dẫn tới model Song

dotenv.config();

const markPremiumSongs = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const allSongs = await Song.find();
  const total = allSongs.length;
  const targetCount = Math.floor(total * 0.4);

  // Shuffle mảng và chọn ngẫu nhiên 40%
  const shuffled = allSongs.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, targetCount);

  const updates = selected.map(song =>
    Song.updateOne({ _id: song._id }, { isPremium: true })
  );

  await Promise.all(updates);

  console.log(`✅ Đã cập nhật ${targetCount} bài hát thành Premium.`);
  mongoose.disconnect();
};

markPremiumSongs().catch(console.error);
