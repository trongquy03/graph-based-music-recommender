import mongoose from "mongoose";
import { Album } from "./album.model.js";
import { Song } from "./song.model.js";
import { Like } from "./like.model.js";
import { Rating } from "./rating.model.js";
import { ListeningHistory } from "./listeningHistory.model.js";
import { deleteFromCloudinary } from "../lib/cloudinary.js";

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    bio: {
        type: String,
        default: "",
    },
    imageUrl: {
        type: String,
        required: false,
    },
    name_normalized: {
        type: String,
    },
    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    followers: [{ 
    type: String, // Clerk userId
    ref: "User",
  }],
}, { timestamps: true });

artistSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    // Xoá tất cả albums
    const albums = await Album.find({ artist: doc._id });
    const albumIds = albums.map((a) => a._id);
    await Album.deleteMany({ artist: doc._id });

    // Xoá ảnh album
    for (const album of albums) {
      await deleteFromCloudinary(album.imageUrl);
    }

    // Xoá tất cả songs
    const songs = await Song.find({ artist: doc._id });
    const songIds = songs.map((s) => s._id);
    await Song.deleteMany({ artist: doc._id });

    // Xoá file nhạc và ảnh bài hát
    for (const song of songs) {
      await deleteFromCloudinary(song.imageUrl);
      await deleteFromCloudinary(song.audioUrl);
    }

    await Promise.all([
      Rating.deleteMany({ song: { $in: songIds } }),
      Like.deleteMany({ song: { $in: songIds } }),
      ListeningHistory.deleteMany({ song: { $in: songIds } }),
    ]);

    // Xoá ảnh artist
    await deleteFromCloudinary(doc.imageUrl);
  } catch (err) {
    console.error("Error cleaning up artist:", err);
  }
});

export const Artist = mongoose.model("Artist", artistSchema);
