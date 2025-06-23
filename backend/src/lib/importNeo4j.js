import mongoose from "mongoose";
import neo4j from "neo4j-driver";
import { User } from "../models/user.model.js";
import { Artist } from "../models/artist.model.js";
import { Album } from "../models/album.model.js";
import { Song } from "../models/song.model.js";
import { Like } from "../models/like.model.js";
import { Rating } from "../models/rating.model.js";
import { ListeningHistory } from "../models/listeningHistory.model.js";


// MongoDB connect
await mongoose.connect("mongodb://localhost:27017/your_db");

// Neo4j connect
const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "test123"));
const session = driver.session();

// Clear existing data
await session.run("MATCH (n) DETACH DELETE n");

// USERS
const users = await User.find();
for (const u of users) {
  await session.run(`
    MERGE (user:User {id: $id})
    SET user.fullName = $fullName
  `, {
    id: u.clerkId,
    fullName: u.fullName,
  });
}

// ARTISTS + TAGS
const artists = await Artist.find();
for (const a of artists) {
  await session.run(`
    MERGE (artist:Artist {id: $id})
    SET artist.name = $name
  `, { id: a._id.toString(), name: a.name });

  for (const tag of a.tags) {
    await session.run(`
      MERGE (t:Tag {name: $tag})
      MERGE (a:Artist {id: $artistId})
      MERGE (a)-[r:HAS_TAG {weight: 1.0}]->(t)
    `, {
      tag: tag.name,
      artistId: a._id.toString(),
    });
  }
}

// ALBUMS
const albums = await Album.find();
for (const album of albums) {
  await session.run(`
    MERGE (al:Album {id: $id})
    SET al.title = $title, al.releaseYear = $year
  `, {
    id: album._id.toString(),
    title: album.title,
    year: album.releaseYear,
  });

  // album → artist
  await session.run(`
    MATCH (al:Album {id: $albumId})
    MATCH (ar:Artist {id: $artistId})
    MERGE (ar)-[:RELEASED_ALBUM]->(al)
  `, {
    albumId: album._id.toString(),
    artistId: album.artist.toString(),
  });
}

// SONGS
const songs = await Song.find();
for (const s of songs) {
  await session.run(`
    MERGE (song:Song {id: $id})
    SET song.title = $title, song.genre = $genre, song.mood = $mood
  `, {
    id: s._id.toString(),
    title: s.title,
    genre: s.genre,
    mood: s.mood
  });

  // song → artist
  await session.run(`
    MATCH (s:Song {id: $songId})
    MATCH (a:Artist {id: $artistId})
    MERGE (s)-[:PERFORMED_BY]->(a)
  `, {
    songId: s._id.toString(),
    artistId: s.artist.toString(),
  });

  // song → album
  if (s.albumId) {
    await session.run(`
      MATCH (s:Song {id: $songId})
      MATCH (al:Album {id: $albumId})
      MERGE (s)-[:IN_ALBUM]->(al)
    `, {
      songId: s._id.toString(),
      albumId: s.albumId.toString(),
    });
  }

  // tags
  for (const tag of s.tags) {
    await session.run(`
      MERGE (t:Tag {name: $tag})
      MATCH (s:Song {id: $songId})
      MERGE (s)-[r:HAS_TAG {weight: 1.0}]->(t)
    `, {
      songId: s._id.toString(),
      tag: tag.name,
    });
  }
}

// USER INTERACTIONS
const likes = await Like.find();
for (const l of likes) {
  await session.run(`
    MATCH (u:User {id: $userId}), (s:Song {id: $songId})
    MERGE (u)-[:LIKED]->(s)
  `, {
    userId: l.user,
    songId: l.song.toString(),
  });
}

const listens = await ListeningHistory.find();
for (const l of listens) {
  await session.run(`
    MATCH (u:User {id: $userId}), (s:Song {id: $songId})
    MERGE (u)-[:LISTENED_TO]->(s)
  `, {
    userId: l.user,
    songId: l.song.toString(),
  });
}

const ratings = await Rating.find();
for (const r of ratings) {
  await session.run(`
    MATCH (u:User {id: $userId}), (s:Song {id: $songId})
    MERGE (u)-[ra:RATED]->(s)
    SET ra.rating = $rating
  `, {
    userId: r.user,
    songId: r.song.toString(),
    rating: r.rating
  });
}

// FOLLOW ARTIST
for (const u of users) {
  for (const artistId of u.followedArtists || []) {
    await session.run(`
      MATCH (u:User {id: $userId}), (a:Artist {id: $artistId})
      MERGE (u)-[:FOLLOWED]->(a)
    `, {
      userId: u.clerkId,
      artistId: artistId.toString(),
    });
  }
}

await session.close();
await driver.close();
await mongoose.disconnect();
console.log("✅ Import thành công từ MongoDB sang Neo4j!");
