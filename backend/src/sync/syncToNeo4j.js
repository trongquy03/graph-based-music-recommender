import "dotenv/config";
import { connectDB, neo4jSession } from "../lib/db.js";
import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";
import { Artist } from "../models/artist.model.js";
import { Album } from "../models/album.model.js";
import { Like } from "../models/like.model.js";
import { Rating } from "../models/rating.model.js";
import { ListeningHistory } from "../models/listeningHistory.model.js";

const syncToNeo4j = async () => {
  try {
    await connectDB();

    // Sync Genres & Moods as nodes
    const genres = ["pop", "rock", "hiphop", "ballad","rap", "edm", "rnb", "country", "lofi", "movie"];
    const moods = ["happy", "sad", "chill", "motivational"];

    for (const genre of genres) {
      await neo4jSession.run(`MERGE (:Genre {name: $name})`, { name: genre });
    }
    for (const mood of moods) {
      await neo4jSession.run(`MERGE (:Mood {name: $name})`, { name: mood });
    }

    // Artists
    const artists = await Artist.find();
    for (const artist of artists) {
      await neo4jSession.run(
        `MERGE (a:Artist {id: $id})
         SET a.name = $name`,
        { id: artist._id.toString(), name: artist.name }
      );
    }

    // Albums
    const albums = await Album.find();
    for (const album of albums) {
      await neo4jSession.run(
        `MERGE (al:Album {id: $id})
         SET al.title = $title, al.releaseYear = $year
         WITH al
         MATCH (a:Artist {id: $artistId})
         MERGE (a)-[:PRODUCED]->(al)`,
        {
          id: album._id.toString(),
          title: album.title,
          year: album.releaseYear,
          artistId: album.artist.toString(),
        }
      );
    }

    // Songs
    const songs = await Song.find();
    for (const song of songs) {
        if (!song.genre || !song.mood) {
        console.warn(` Bỏ qua song thiếu genre/mood: ${song.title}`);
        continue;
    }

    await neo4jSession.run(
        `MERGE (s:Song {id: $id})
        SET s.title = $title
        WITH s
        MATCH (a:Artist {id: $artistId})
        MERGE (s)-[:BY]->(a)
        WITH s
        OPTIONAL MATCH (al:Album {id: $albumId})
        FOREACH (_ IN CASE WHEN al IS NOT NULL THEN [1] ELSE [] END |
        MERGE (s)-[:IN]->(al)
        )
        WITH s
        MATCH (g:Genre {name: $genre})
        MERGE (s)-[:HAS_GENRE]->(g)
        WITH s
        MATCH (m:Mood {name: $mood})
        MERGE (s)-[:HAS_MOOD]->(m)`,
        {
        id: song._id.toString(),
        title: song.title,
        artistId: song.artist.toString(),
        albumId: song.albumId?.toString() || null,
        genre: song.genre,
        mood: song.mood,
        }
    );
}


    // Users
    const users = await User.find();
    for (const user of users) {
      await neo4jSession.run(
        `MERGE (u:User {id: $id})
         SET u.name = $name`,
        {
          id: user.clerkId,
          name: user.fullName,
        }
      );

      // Followed Artists
      for (const artistId of user.followedArtists) {
        await neo4jSession.run(
          `MATCH (u:User {id: $uid}), (a:Artist {id: $aid})
           MERGE (u)-[:FOLLOWS]->(a)`,
          {
            uid: user.clerkId,
            aid: artistId.toString(),
          }
        );
      }
    }

    // Likes
    const likes = await Like.find();
    for (const like of likes) {
      await neo4jSession.run(
        `MATCH (u:User {id: $uid}), (s:Song {id: $sid})
         MERGE (u)-[:LIKED]->(s)`,
        {
          uid: like.user,
          sid: like.song.toString(),
        }
      );
    }

    // Ratings
    const ratings = await Rating.find();
    for (const rate of ratings) {
      await neo4jSession.run(
        `MATCH (u:User {id: $uid}), (s:Song {id: $sid})
         MERGE (u)-[r:RATED]->(s)
         SET r.value = $value`,
        {
          uid: rate.user,
          sid: rate.song.toString(),
          value: rate.rating,
        }
      );
    }

    // Listening History
    const histories = await ListeningHistory.find();
    for (const h of histories) {
      await neo4jSession.run(
        `MATCH (u:User {id: $uid}), (s:Song {id: $sid})
         MERGE (u)-[r:LISTENED_AT]->(s)
         SET r.timestamp = datetime($timestamp)`,
        {
          uid: h.user,
          sid: h.song.toString(),
          timestamp: h.listenedAt.toISOString(),
        }
      );
    }

    console.log("Sync to Neo4j hoàn tất!");
  } catch (err) {
    console.error("Sync failed:", err);
  } finally {
    await neo4jSession.close();
    process.exit(0);
  }
};

syncToNeo4j();
