import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    user: { type: String, ref: "User", required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    created_by_ai: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
