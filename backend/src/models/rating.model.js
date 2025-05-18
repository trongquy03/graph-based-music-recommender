import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    user: {
        type: String, // Clerk userId
        required: true
    },
    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, { timestamps: true });

// Một user chỉ được rate 1 lần cho mỗi bài hát
ratingSchema.index({ user: 1, song: 1 }, { unique: true });

export const Rating = mongoose.model("Rating", ratingSchema);
