import {Song} from "../models/song.model.js";
import {Album} from "../models/album.model.js"
import {Artist} from "../models/artist.model.js"
import cloudinary from "../lib/cloudinary.js"
import { neo4jSession } from "../lib/db.js";
import { removeVietnameseTones } from "../lib/removeDiacritics.js";
import { generateLyricsFromCloudinaryUrl } from "../lib/lyrics.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { uploadRawToCloudinary } from "../lib/cloudinary.js";

//helper function for cloudinary uploads
const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto",
        })
        return result.secure_url
    } catch (error) {
        console.error(`Error uploading ${file.name} to Cloudinary`, error);
        throw new Error("Error uploading to cloudinary");
    }
}

export const createArtist = async (req, res, next) => {
  try {
    const { name, bio, imageUrl } = req.body;

    if (!name || !imageUrl)
      return res.status(400).json({ message: "Name and imageUrl are required" });

    const existing = await Artist.findOne({ name });
    if (existing) return res.status(409).json({ message: "Artist already exists" });

    const artist = new Artist({
      name,
      bio: bio || "",
      imageUrl,
      name_normalized: removeVietnameseTones(name.toLowerCase()),
    });

    await artist.save();

    await neo4jSession.run(
      `MERGE (a:Artist {id: $id, name: $name})`,
      {
        id: artist._id.toString(),
        name: artist.name,
      }
    );

    res.status(201).json(artist);
  } catch (err) {
    console.error("Error creating artist:", err);
    next(err);
  }
};

export const updateArtist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, bio, imageUrl } = req.body;

    const existingArtist = await Artist.findById(id);
    if (!existingArtist) return res.status(404).json({ message: "Artist not found" });

    if (imageUrl && imageUrl !== existingArtist.imageUrl) {
      await deleteFromCloudinary(existingArtist.imageUrl);
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      id,
      {
        name,
        bio,
        imageUrl: imageUrl || existingArtist.imageUrl,
        name_normalized: removeVietnameseTones(name.toLowerCase()),
      },
      { new: true }
    );

    await neo4jSession.run(
      `MATCH (a:Artist {id: $id})
       SET a.name = $name`,
      {
        id,
        name,
      }
    );

    res.status(200).json(updatedArtist);
  } catch (err) {
    console.error("Error updating artist:", err);
    next(err);
  }
};

export const deleteArtist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findById(id);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    // Xoá các bài hát liên quan từ MongoDB
    const songs = await Song.find({ artist: id });
    for (const song of songs) {
      if (song.albumId) {
        await Album.findByIdAndUpdate(song.albumId, {
          $pull: { songs: song._id },
        });
      }
      await Song.findByIdAndDelete(song._id);

      // Xoá song khỏi Neo4j
      await neo4jSession.run(
        `MATCH (s:Song {id: $id}) DETACH DELETE s`,
        { id: song._id.toString() }
      );
    }

    // Xoá artist từ MongoDB
    await Artist.findOneAndDelete({ _id: id });

    // Xoá artist từ Neo4j
    await neo4jSession.run(
      `MATCH (a:Artist {id: $id}) DETACH DELETE a`,
      { id }
    );

    res.status(200).json({ message: "Artist and related songs deleted successfully" });
  } catch (err) {
    console.error("Error deleting artist:", err);
    next(err);
  }
};


export const createSong = async (req, res, next) => {
  try {
    const { title, artistId, albumId, duration, audioUrl, imageUrl, genre, mood } = req.body;

    if (!title || !artistId || !audioUrl || !imageUrl || !genre) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const lyricsUrl = "";

    const song = new Song({
      title,
      artist: artistId,
      audioUrl,
      imageUrl,
      duration,
      albumId: albumId || null,
      genre,
      mood,
      lyricsUrl,
      title_normalized: removeVietnameseTones(title.toLowerCase()),
    });

    await song.save();

    if (albumId) {
      await Album.findByIdAndUpdate(albumId, {
        $push: { songs: song._id },
      });
    }

    await neo4jSession.run(
      `MERGE (s:Song {id: $id})
      SET s.title = $title, s.genre = $genre, s.mood = $mood
      WITH s
      MATCH (a:Artist {id: $artistId})
      MERGE (a)-[:By]->(s)`,
      {
        id: song._id.toString(),
        title: song.title,
        genre: song.genre,
        mood: song.mood,
        artistId,
      }
    );
    if (albumId) {
    await neo4jSession.run(
      `
      MATCH (s:Song {id: $songId})
      MATCH (al:Album {id: $albumId})
      MERGE (s)-[:IN_ALBUM]->(al)
      `,
      {
        songId: song._id.toString(),
        albumId: albumId.toString(),
      }
    );
  }


    res.status(201).json(song);
  } catch (error) {
    console.error("Error in createSong:", error);
    next(error);
  }
};

export const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artistId, albumId, duration, audioUrl, imageUrl, genre, mood } = req.body;

    const existingSong = await Song.findById(id);
    if (!existingSong) return res.status(404).json({ message: "Song not found" });

    if (imageUrl && imageUrl !== existingSong.imageUrl) {
      await deleteFromCloudinary(existingSong.imageUrl);
    }

    if (audioUrl && audioUrl !== existingSong.audioUrl) {
      await deleteFromCloudinary(existingSong.audioUrl);
    }

    if (
      existingSong.albumId &&
      (!albumId || existingSong.albumId.toString() !== albumId)
    ) {
      await Album.findByIdAndUpdate(existingSong.albumId, {
        $pull: { songs: existingSong._id },
      });
    }

    const updatedSong = await Song.findByIdAndUpdate(
      id,
      {
        title,
        artist: artistId,
        albumId: albumId === "none" ? null : albumId,
        duration,
        audioUrl: audioUrl || existingSong.audioUrl,
        imageUrl: imageUrl || existingSong.imageUrl,
        genre: genre || existingSong.genre,
        mood: mood || existingSong.mood,
        title_normalized: removeVietnameseTones(title.toLowerCase()),
      },
      { new: true }
    );

    if (
      albumId &&
      (!existingSong.albumId || existingSong.albumId.toString() !== albumId)
    ) {
      await Album.findByIdAndUpdate(albumId, {
        $addToSet: { songs: updatedSong._id },
      });
    }


    await neo4jSession.run(
      `
      MATCH (s:Song {id: $id})
      OPTIONAL MATCH (s)<-[r:By]-(:Artist)
      DELETE r
      WITH s
      MERGE (a:Artist {id: $artistId})
      MERGE (a)-[:By]->(s)
      SET s.title = $title, s.genre = $genre, s.mood = $mood
      `,
      {
        id: id.toString(),
        title,
        genre,
        mood,
        artistId: artistId.toString(),
      }
    );

    if (albumId) {
      await neo4jSession.run(
        `MATCH (s:Song {id: $id})-[oldRel:IN_ALBUM]->(:Album)
         DELETE oldRel
         WITH s
         MATCH (al:Album {id: $albumId})
         MERGE (s)-[:IN_ALBUM]->(al)`,
        {
          id: id.toString(),
          albumId: albumId.toString(),
        }
      );
    } else {
      await neo4jSession.run(
        `MATCH (s:Song {id: $id})-[rel:IN_ALBUM]->(:Album)
         DELETE rel`,
        { id: id.toString() }
      );
    }

    res.status(200).json(updatedSong);
  } catch (error) {
    console.error("Error in updateSong", error);
    next(error);
  }
};


export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, {
        $pull: { songs: song._id },
      });
    }

    await Song.findOneAndDelete({ _id: id });

    await neo4jSession.run(
      `MATCH (s:Song {id: $id}) DETACH DELETE s`,
      { id }
    );

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.log("Error in deleteSong", error);
    next(error);
  }
};

export const createAlbum = async (req, res, next) => {
  try {
    const { title, artistId, releaseYear, imageUrl } = req.body;

    if (!title || !artistId || !imageUrl)
      return res.status(400).json({ message: "Missing fields" });

    const album = new Album({
      title,
      artist: artistId,
      imageUrl,
      releaseYear,
      title_normalized: removeVietnameseTones(title.toLowerCase()),
    });

    await album.save();

    await neo4jSession.run(
      `MATCH (a:Artist {id: $artistId})
       MERGE (al:Album {
         id: $id,
         title: $title,
         releaseYear: $year
       })
       MERGE (a)-[:PRODUCED]->(al)`,
      {
        id: album._id.toString(),
        title: album.title,
        year: album.releaseYear,
        artistId,
      }
    );

    res.status(201).json(album);
  } catch (error) {
    console.log("Error in createAlbum", error);
    next(error);
  }
};

export const updateAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artistId, releaseYear, imageUrl } = req.body;

    const existingAlbum = await Album.findById(id);
    if (!existingAlbum) return res.status(404).json({ message: "Album not found" });

    if (imageUrl && imageUrl !== existingAlbum.imageUrl) {
      await deleteFromCloudinary(existingAlbum.imageUrl);
    }

    const updatedAlbum = await Album.findByIdAndUpdate(
      id,
      {
        title,
        artist: artistId,
        releaseYear,
        imageUrl: imageUrl || existingAlbum.imageUrl,
        title_normalized: removeVietnameseTones(title.toLowerCase()),
      },
      { new: true }
    );

    await neo4jSession.run(
      `MATCH (al:Album {id: $id})
       SET al.title = $title, al.releaseYear = $year`,
      {
        id,
        title,
        year: releaseYear,
      }
    );

    if (artistId && artistId !== existingAlbum.artist.toString()) {
      await neo4jSession.run(`
        MATCH (aOld:Artist)-[r:PRODUCED]->(al:Album {id: $id})
        DELETE r
        WITH al
        MATCH (aNew:Artist {id: $artistId})
        MERGE (aNew)-[:PRODUCED]->(al)
      `, {
        id,
        artistId,
      });
}


    res.status(200).json(updatedAlbum);
  } catch (error) {
    console.log("Error in updateAlbum", error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;

    const album = await Album.findById(id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    await Album.findOneAndDelete({ _id: id });

    await neo4jSession.run(
      `MATCH (al:Album {id: $id}) DETACH DELETE al`,
      { id }
    );

    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    console.log("Error in deleteAlbum", error);
    next(error);
  }
};


export const generateLyricsForSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);

    if (!song || !song.audioUrl) {
      return res.status(404).json({ message: "Song not found or missing audioUrl" });
    }

    const lyricsUrl = await generateLyricsFromCloudinaryUrl(song.audioUrl);

    if (!lyricsUrl) {
      return res.status(500).json({ message: "Failed to generate lyrics" });
    }

    song.lyricsUrl = lyricsUrl;
    await song.save();

    res.status(200).json({ lyricsUrl });
  } catch (error) {
    console.error("Error generating lyrics:", error);
    next(error);
  }
};

export const uploadLyricsManually = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lyricsText } = req.body;

    if (!lyricsText || lyricsText.length < 10) {
      return res.status(400).json({ message: "Lyrics text is too short or missing." });
    }

    const song = await Song.findById(id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    // Tạo file tạm .srt
    const tempDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const filename = `lyrics-${uuidv4()}.srt`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, lyricsText);

    // Upload lên Cloudinary
    const cloudUrl = await uploadRawToCloudinary(filepath);

    // Cập nhật bài hát
    song.lyricsUrl = cloudUrl;
    await song.save();

    fs.unlinkSync(filepath); // Xoá file tạm

    res.status(200).json({ lyricsUrl: cloudUrl });
  } catch (err) {
    console.error("Error in manual lyrics upload:", err);
    next(err);
  }
};

export const checkAdmin = async (req, res, next) => {
    res.status(200).json({admin: true});
}

