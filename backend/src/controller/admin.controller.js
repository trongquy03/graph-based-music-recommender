import {Song} from "../models/song.model.js";
import {Album} from "../models/album.model.js"
import {Artist} from "../models/artist.model.js"
import cloudinary from "../lib/cloudinary.js"
import { removeVietnameseTones } from "../lib/removeDiacritics.js";

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

    // Nếu ảnh đổi → xóa ảnh cũ
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

    //  middleware để xoá album, song, rating, like, history
    await Artist.findOneAndDelete({ _id: id });

    res.status(200).json({ message: "Artist deleted successfully" });
  } catch (err) {
    console.error("Error deleting artist:", err);
    next(err);
  }
};


export const createSong = async (req, res, next) => {
  try {
    const { title, artistId, albumId, duration, audioUrl, imageUrl, genre, mood } = req.body;

    if (!title || !artistId || !audioUrl || !imageUrl || !genre || !mood) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const song = new Song({
      title,
      artist: artistId,
      audioUrl,
      imageUrl,
      duration,
      albumId: albumId || null,
      genre,
      mood,
      title_normalized: removeVietnameseTones(title.toLowerCase()),
    });

    await song.save();

    if (albumId) {
      await Album.findByIdAndUpdate(albumId, {
        $push: { songs: song._id },
      });
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

    // Nếu đổi album → gỡ khỏi album cũ
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

    // Nếu thêm vào album mới
    if (
      albumId &&
      (!existingSong.albumId || existingSong.albumId.toString() !== albumId)
    ) {
      await Album.findByIdAndUpdate(albumId, {
        $addToSet: { songs: updatedSong._id },
      });
    }

    res.status(200).json(updatedSong);
  } catch (error) {
    console.log("Error in updateSong", error);
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

    // Nếu bài hát thuộc album, cập nhật album
    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, {
        $pull: { songs: song._id },
      });
    }

    //  findOneAndDelete để trigger middleware
    await Song.findOneAndDelete({ _id: id });

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

    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    console.log("Error in deleteAlbum", error);
    next(error);
  }
};


export const checkAdmin = async (req, res, next) => {
    res.status(200).json({admin: true});
}