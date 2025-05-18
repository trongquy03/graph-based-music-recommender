import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    user: {
        type: String, // Clerk userId
        required: true
    },
    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
        required: true
    }
}, {timestamps: true});

// Đảm bảo một người không like một bài 2 lần
likeSchema.index({ user: 1, song: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);
