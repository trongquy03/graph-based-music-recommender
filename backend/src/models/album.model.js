import mongoose from "mongoose";
import { Song } from "./song.model.js";
import { Like } from "./like.model.js";
import { Rating } from "./rating.model.js";
import { ListeningHistory } from "./listeningHistory.model.js";
import { deleteFromCloudinary } from "../lib/cloudinary.js";

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    releaseYear: {
        type: Number,
        required: true
    },
    title_normalized: String,
    artist_normalized: String,
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
}, {timestamps:true});

albumSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    const albumId = doc._id;

    // 1. Tìm tất cả bài hát thuộc album
    const songs = await Song.find({ albumId });
    const songIds = songs.map((s) => s._id);

    // 2. Xoá file nhạc và ảnh từng bài hát trên Cloudinary
    for (const song of songs) {
      await deleteFromCloudinary(song.audioUrl);
      await deleteFromCloudinary(song.imageUrl);
    }

    // 3. Xoá tất cả bài hát khỏi DB
    await Song.deleteMany({ _id: { $in: songIds } });

    // 4. Xoá dữ liệu liên quan
    await Promise.all([
      Rating.deleteMany({ song: { $in: songIds } }),
      Like.deleteMany({ song: { $in: songIds } }),
      ListeningHistory.deleteMany({ song: { $in: songIds } }),
    ]);

    // 5. Xoá ảnh album
    await deleteFromCloudinary(doc.imageUrl);

    console.log(`Album ${albumId} và toàn bộ dữ liệu liên quan đã bị xoá sạch`);
  } catch (err) {
    console.error("Lỗi khi xóa dữ liệu liên quan album:", err);
  }
});

export const Album = mongoose.model("Album", albumSchema);