import mongoose from "mongoose";
import dotenv from "dotenv";
import neo4j from "neo4j-driver";

dotenv.config();

// 1. Kết nối MongoDB
await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ MongoDB connected");

// 2. Mô hình Mongo
const artistSchema = new mongoose.Schema({ name: String });
const userSchema = new mongoose.Schema({ clerkId: String });
const songSchema = new mongoose.Schema({
  title: String,
  artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist" },
  genre: String,
  mood: String,
});
const likeSchema = new mongoose.Schema({ user: String, song: mongoose.Types.ObjectId });
const ratingSchema = new mongoose.Schema({ user: String, song: mongoose.Types.ObjectId, rating: Number });

const Artist = mongoose.model("Artist", artistSchema);
const Song = mongoose.model("Song", songSchema);
const User = mongoose.model("User", userSchema);
const Like = mongoose.model("Like", likeSchema);
const Rating = mongoose.model("Rating", ratingSchema);

// 3. Kết nối Neo4j
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const session = driver.session();

// 4. Đồng bộ dữ liệu
const run = async () => {
  try {
    const users = await User.find();
    const artists = await Artist.find();
    const songs = await Song.find().populate("artist");
    const likes = await Like.find();
    const ratings = await Rating.find();

    // Tạo user node
    for (const u of users) {
        await session.run(
      `MERGE (u:User {id: $id})
      SET u.name = $name`,
      {
        id: u.clerkId,
        name: u.fullName || "Unknown"
      }
    );

    }

    // Tạo artist node
    for (const a of artists) {
      await session.run(`MERGE (:Artist {id: $id, name: $name})`, {
        id: a._id.toString(),
        name: a.name,
      });
    }

    // Tạo song + quan hệ By
    for (const s of songs) {
      await session.run(
        `MERGE (song:Song {id: $id})
        SET song.title = $title,
            song.genre = $genre,
            song.mood = $mood

         WITH song
         MATCH (a:Artist {id: $artistId})
         MERGE (a)-[:By]->(song)`,
        {
          id: s._id.toString(),
          title: s.title,
          genre: s.genre || "",
          mood: s.mood || "",
          artistId: s.artist?._id.toString(),
        }
      );
    }

    // Quan hệ LIKE
    for (const l of likes) {
      await session.run(
        `MATCH (u:User {id: $userId}), (s:Song {id: $songId})
         MERGE (u)-[:LIKES]->(s)`,
        {
          userId: l.user,
          songId: l.song.toString(),
        }
      );
    }

    // Quan hệ RATED
    for (const r of ratings) {
      await session.run(
        `MATCH (u:User {id: $userId}), (s:Song {id: $songId})
         MERGE (u)-[rel:RATED]->(s)
         SET rel.rating = $rating`,
        {
          userId: r.user,
          songId: r.song.toString(),
          rating: r.rating,
        }
      );
    }

    console.log("✅ Sync từ MongoDB → Neo4j hoàn tất");
  } catch (err) {
    console.error("❌ Lỗi:", err);
  } finally {
    await session.close();
    await driver.close();
    await mongoose.disconnect();
  }
};

run();
