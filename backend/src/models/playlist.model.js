import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  owner: {
    type: String,
    ref: "User",
    required: true
  },
  songs: [{
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song"
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });


export const Playlist = mongoose.model("Playlist", playlistSchema);
