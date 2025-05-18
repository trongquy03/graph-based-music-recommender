import mongoose from "mongoose";

const listeningHistorySchema = new mongoose.Schema({
    user: {
        type: String, // Clerk userId
        required: true
    },
    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
        required: true
    },
    listenedAt: {
        type: Date,
        default: Date.now
    }
});

export const ListeningHistory = mongoose.model("ListeningHistory", listeningHistorySchema);
