import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { Like } from "../models/like.model.js";
import { Rating } from "../models/rating.model.js";
import { ListeningHistory } from "../models/listeningHistory.model.js";
import dotenv from "dotenv";
dotenv.config();


// Kết nối DB trước khi chạy script
const MONGO_URI = process.env.MONGODB_URI; // ✅ khớp tên với .env


async function cleanupOrphanData() {
  await mongoose.connect(MONGO_URI);
  console.log("🔌 Connected to MongoDB");

  const validSongIds = await Song.find().distinct("_id");
  console.log(`🎵 Found ${validSongIds.length} valid songs`);

  // Xoá rating cũ không có song
  const ratingResult = await Rating.deleteMany({ song: { $nin: validSongIds } });
  console.log(`🧹 Deleted ${ratingResult.deletedCount} orphan ratings`);

  // Xoá like cũ không có song
  const likeResult = await Like.deleteMany({ song: { $nin: validSongIds } });
  console.log(`🧹 Deleted ${likeResult.deletedCount} orphan likes`);

  // Xoá history cũ không có song
  const historyResult = await ListeningHistory.deleteMany({ song: { $nin: validSongIds } });
  console.log(`🧹 Deleted ${historyResult.deletedCount} orphan listening history records`);

  await mongoose.disconnect();
  console.log("✅ Cleanup complete and disconnected.");
}

cleanupOrphanData().catch((err) => {
  console.error("❌ Error during cleanup:", err);
  process.exit(1);
});
