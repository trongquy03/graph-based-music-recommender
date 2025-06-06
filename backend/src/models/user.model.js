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
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    subscriptionType: { type: String, enum: ["free", "7days", "1month", "1year"], default: "free" }
},
 {timestamps: true}
);

export const User = mongoose.model("User", userSchema);