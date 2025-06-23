import mongoose from "mongoose";
import dotenv from "dotenv";

// Load biến môi trường từ .env
dotenv.config();

// ✅ Kết nối MongoDB với cấu hình ổn định
await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("✅ MongoDB connected");

// ✅ Import models từ thư mục models (đảm bảo đúng đường dẫn)
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";

// ✅ Hàm chính
const run = async () => {
  try {
    // === 1. XÓA SONG có youtubeUrl
    console.log("🔍 Đang tìm bài hát có youtubeUrl...");
    const songsToDelete = await Song.find({ youtubeUrl: { $ne: "" } });
    const songIds = songsToDelete.map((s) => s._id);

    const deletedSongs = await Song.deleteMany({ _id: { $in: songIds } });
    console.log(`✅ Đã xoá ${deletedSongs.deletedCount} bài hát có youtubeUrl.`);

    // === 2. XÓA ALBUM không còn bài
    const emptyAlbums = await Album.find({ songs: { $size: 0 } });
    const deletedAlbums = await Album.deleteMany({ _id: { $in: emptyAlbums.map(a => a._id) } });
    console.log(`✅ Đã xoá ${deletedAlbums.deletedCount} album không còn bài.`);

    // === 3. XÓA ARTIST không còn bài
    const emptyArtists = await Artist.find({ songs: { $size: 0 } });
    const deletedArtists = await Artist.deleteMany({ _id: { $in: emptyArtists.map(a => a._id) } });
    console.log(`✅ Đã xoá ${deletedArtists.deletedCount} artist không còn bài.`);
  } catch (err) {
    console.error("❌ Lỗi trong quá trình xoá:", err);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Đã ngắt kết nối MongoDB");
  }
};

run();
