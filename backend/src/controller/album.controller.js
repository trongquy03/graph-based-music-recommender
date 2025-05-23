import { Album } from "../models/album.model.js";

export const getAllAlbums = async (req, res, next) => {
  try {
    const albums = await Album.find()
      .populate("artist", "name");

    res.status(200).json(albums);
  } catch (error) {
    next(error);
  }
};

export const getAllAlbumById = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const album = await Album.findById(albumId)
      .populate("artist", "name")
      .populate({
        path: "songs",
        populate: { path: "artist", select: "name" }
      });

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    res.status(200).json(album);
  } catch (error) {
    next(error);
  }
};