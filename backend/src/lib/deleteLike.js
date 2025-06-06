import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Models
import { Song } from "../models/song.model.js";
import { Like } from "../models/like.model.js";
import { Rating } from "../models/rating.model.js";
import { ListeningHistory } from "../models/listeningHistory.model.js";

await mongoose.connect(process.env.MONGODB_URI);

// Bước 1: Lấy danh sách tất cả _id bài hát còn tồn tại
const validSongIds = (await Song.find({}, "_id")).map((s) => s._id.toString());

// Bước 2: Xoá các bản ghi liên quan đến bài hát không còn tồn tại
const resultLikes = await Like.deleteMany({ song: { $nin: validSongIds } });
const resultRatings = await Rating.deleteMany({ song: { $nin: validSongIds } });
const resultHistory = await ListeningHistory.deleteMany({ song: { $nin: validSongIds } });

console.log("🧹 Cleanup complete:");
console.log("Likes deleted:", resultLikes.deletedCount);
console.log("Ratings deleted:", resultRatings.deletedCount);
console.log("History deleted:", resultHistory.deletedCount);

await mongoose.disconnect();
