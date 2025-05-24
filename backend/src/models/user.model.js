import mongoose from "mongoose";
import { Artist } from "./artist.model.js";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    followedArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],
    clerkId: {
        type: String,
        required: true,
        unique: true
    },
},
 {timestamps: true}
);

export const User = mongoose.model("User", userSchema);