import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: String,
    ref: "User", // Clerk userId
    required: true,
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema);
