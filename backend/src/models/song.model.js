import mongoose from "mongoose";
import { Rating } from "./rating.model.js";
import { Like } from "./like.model.js";
import { ListeningHistory } from "./listeningHistory.model.js";
import { deleteFromCloudinary } from "../lib/cloudinary.js";

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  albumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Album",
    required: false,
  },
  title_normalized: String,
  artist_normalized: String,
   mood: {
    type: String,
    enum: ["happy", "sad", "chill", "motivational"],
    default: "chill"
  },
  genre: {
    type: String,
    enum: ["pop", "rock", "hiphop", "ballad", "edm", "rnb", "country", "lofi", "movie"],
    required: true
  },
  lyricsUrl: {
    type: String,
    default: "",
  },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete related Rating, Like, ListeningHistory when a Song is deleted
songSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    await deleteFromCloudinary(doc.audioUrl);
    await deleteFromCloudinary(doc.imageUrl);

    await Promise.all([
      Rating.deleteMany({ song: doc._id }),
      Like.deleteMany({ song: doc._id }),
      ListeningHistory.deleteMany({ song: doc._id }),
    ]);
  } catch (err) {
    console.error(" Error cleaning up song:", err);
  }
});

export const Song = mongoose.model("Song", songSchema);
