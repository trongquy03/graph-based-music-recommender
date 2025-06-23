import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import neo4j from "neo4j-driver";

// === Import Mongoose Models ===
import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";
import { Artist } from "../models/artist.model.js";
import { Album } from "../models/album.model.js";
import { Like } from "../models/like.model.js";
import { Rating } from "../models/rating.model.js";
import { ListeningHistory } from "../models/listeningHistory.model.js";

// === MongoDB Connection ===
await mongoose.connect(process.env.MONGODB_URI);

// === Neo4j Connection ===
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const session = driver.session();

async function importData() {
  try {
    console.log("🚀 Starting import...");

    // === USERS ===
    const users = await User.find();
    for (const u of users) {
      await session.run(
        `MERGE (u:User {id: $id}) SET u.fullName = $fullName`,
        { id: u.clerkId, fullName: u.fullName }
      );
    }

    // === ARTISTS ===
    const artists = await Artist.find();
    for (const a of artists) {
      await session.run(
        `MERGE (a:Artist {id: $id}) SET a.name = $name`,
        { id: a._id.toString(), name: a.name }
      );
    }

    // === ALBUMS ===
    const albums = await Album.find();
    for (const alb of albums) {
      await session.run(
        `MERGE (al:Album {id: $id}) SET al.title = $title`,
        { id: alb._id.toString(), title: alb.title }
      );
    }

    // === SONGS ===
    const songs = await Song.find();
    for (const s of songs) {
      // Tạo node Song và gắn quan hệ với Artist
      await session.run(
        `
        MERGE (s:Song {id: $id}) SET s.title = $title
        WITH s
        MATCH (a:Artist {id: $artistId})
        MERGE (s)-[:PERFORMED_BY]->(a)
      `,
        {
          id: s._id.toString(),
          title: s.title,
          artistId: s.artist.toString(),
        }
      );

      // Nếu có albumId thì mới tạo quan hệ IN_ALBUM
      if (s.albumId) {
        await session.run(
          `
          MATCH (s:Song {id: $songId})
          MATCH (al:Album {id: $albumId})
          MERGE (s)-[:IN_ALBUM]->(al)
        `,
          {
            songId: s._id.toString(),
            albumId: s.albumId.toString(),
          }
        );
      }
    }

    // === RELEASED_ALBUM (Artist -> Album) ===
    for (const alb of albums) {
      if (alb.artist) {
        await session.run(
          `
          MATCH (a:Artist {id: $artistId})
          MATCH (al:Album {id: $albumId})
          MERGE (a)-[:RELEASED_ALBUM]->(al)
        `,
          {
            artistId: alb.artist.toString(),
            albumId: alb._id.toString(),
          }
        );
      }
    }

    // === LIKES ===
    const likes = await Like.find();
    for (const like of likes) {
      await session.run(
        `
        MATCH (u:User {id: $userId}), (s:Song {id: $songId})
        MERGE (u)-[:LIKED]->(s)
      `,
        {
          userId: like.user.toString(),
          songId: like.song.toString(),
        }
      );
    }

    // === LISTENED_TO ===
    const listens = await ListeningHistory.find();
    for (const l of listens) {
      await session.run(
        `
        MATCH (u:User {id: $userId}), (s:Song {id: $songId})
        MERGE (u)-[:LISTENED_TO]->(s)
      `,
        {
          userId: l.user.toString(),
          songId: l.song.toString(),
        }
      );
    }

    // === RATED ===
    const ratings = await Rating.find();
    for (const r of ratings) {
      await session.run(
        `
        MATCH (u:User {id: $userId}), (s:Song {id: $songId})
        MERGE (u)-[rel:RATED]->(s)
        SET rel.stars = $stars
      `,
        {
          userId: r.user.toString(),
          songId: r.song.toString(),
          stars: r.rating,
        }
      );
    }

    // === FOLLOWED (User -> Artist) ===
    for (const u of users) {
      for (const artistId of u.followedArtists) {
        await session.run(
          `
          MATCH (u:User {id: $userId}), (a:Artist {id: $artistId})
          MERGE (u)-[:FOLLOWED]->(a)
        `,
          {
            userId: u.clerkId,
            artistId: artistId.toString(),
          }
        );
      }
    }

    console.log("✅ Import completed!");
  } catch (err) {
    console.error("❌ Import failed:", err);
  } finally {
    await session.close();
    await driver.close();
    await mongoose.disconnect();
  }
}

importData();
