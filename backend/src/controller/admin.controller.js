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
    const { name, bio } = req.body;

    if (!name) return res.status(400).json({ message: "Artist name is required" });
    const existing = await Artist.findOne({ name });
    if (existing) return res.status(409).json({ message: "Artist already exists" });

    let imageUrl = "";
    if (req.files?.imageFile) {
      imageUrl = await uploadToCloudinary(req.files.imageFile);
    }

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
    const { name, bio } = req.body;

    const existingArtist = await Artist.findById(id);
    if (!existingArtist) return res.status(404).json({ message: "Artist not found" });

    let imageUrl = existingArtist.imageUrl;

    if (req.files?.imageFile) {
      await deleteFromCloudinary(existingArtist.imageUrl);
      imageUrl = await uploadToCloudinary(req.files.imageFile);
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      id,
      {
        name,
        bio,
        imageUrl,
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
        if (!req.files || !req.files.audioFile || !req.files.imageFile) {
            return res.status(400).json({message: "please upload all files"});
        }

        const {title, artistId, albumId, duration} = req.body
        const audioFile = req.files.audioFile
        const imageFile = req.files.imageFile

        const audioUrl = await uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        const song = new Song({
            title,
            artist: artistId,
            audioUrl,
            imageUrl,
            duration,
            albumId: albumId || null,
            title_normalized: removeVietnameseTones(title.toLowerCase()),
        })

        await song.save()

        if (albumId) {
            await Album.findByIdAndUpdate(albumId, {
                $push: { songs: song._id },

            });
        }
        res.status(201).json(song)
    } catch (error) {
        console.log("Error in createSong", error);
        next(error);
    }
}

export const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artistId, albumId, duration } = req.body;

    const existingSong = await Song.findById(id);
    if (!existingSong) return res.status(404).json({ message: "Song not found" });

    let imageUrl = existingSong.imageUrl;
    let audioUrl = existingSong.audioUrl;

    if (req.files?.imageFile) {
      //  Xóa ảnh cũ nếu có file mới
      await deleteFromCloudinary(existingSong.imageUrl);
      imageUrl = await uploadToCloudinary(req.files.imageFile);
    }

    if (req.files?.audioFile) {
      // Xóa audio cũ nếu có file mới
      await deleteFromCloudinary(existingSong.audioUrl);
      audioUrl = await uploadToCloudinary(req.files.audioFile);
    }

    const updatedSong = await Song.findByIdAndUpdate(
      id,
      {
        title,
        artist: artistId,
        albumId,
        duration,
        imageUrl,
        audioUrl,
        title_normalized: removeVietnameseTones(title.toLowerCase()),
      },
      { new: true }
    );

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
    const { title, artistId, releaseYear } = req.body;
    const { imageFile } = req.files;
    if (!imageFile) return res.status(400).json({ message: "Album image is required" });
    const imageUrl = await uploadToCloudinary(imageFile);

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
    const { title, artistId, releaseYear } = req.body;

    const existingAlbum = await Album.findById(id);
    if (!existingAlbum) return res.status(404).json({ message: "Album not found" });

    let imageUrl = existingAlbum.imageUrl;

    if (req.files?.imageFile) {
      await deleteFromCloudinary(existingAlbum.imageUrl);
      imageUrl = await uploadToCloudinary(req.files.imageFile);
    }

    const updatedAlbum = await Album.findByIdAndUpdate(
      id,
      {
        title,
        artist: artistId,
        releaseYear,
        imageUrl,
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