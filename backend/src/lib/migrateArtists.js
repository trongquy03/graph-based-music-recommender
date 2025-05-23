import mongoose from "mongoose";
import dotenv from "dotenv";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";
import { connectDB } from "./db.js";

dotenv.config();

const migrateArtists = async () => {
  await connectDB();

  console.log("🚀 Migrating Song.artist...");
  const songs = await Song.find();

  for (const song of songs) {
    if (typeof song.artist === "string") {
      const artistDoc = await Artist.findOne({ name: song.artist });
      if (artistDoc) {
        song.artist = artistDoc._id;
        await song.save();
        console.log(`✅ Updated song "${song.title}"`);
      } else {
        console.warn(`⚠️ Artist "${song.artist}" not found for song "${song.title}"`);
      }
    }
  }

  console.log("🎵 Songs migrated.");

  console.log("🚀 Migrating Album.artist...");
  const albums = await Album.find();

  for (const album of albums) {
    if (typeof album.artist === "string") {
      const artistDoc = await Artist.findOne({ name: album.artist });
      if (artistDoc) {
        album.artist = artistDoc._id;
        await album.save();
        console.log(`✅ Updated album "${album.title}"`);
      } else {
        console.warn(`⚠️ Artist "${album.artist}" not found for album "${album.title}"`);
      }
    }
  }

  console.log("💿 Albums migrated.");
  mongoose.connection.close();
};

migrateArtists().catch((err) => {
  console.error("❌ Migration failed:", err);
  mongoose.connection.close();
});