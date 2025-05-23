import { Artist } from "../models/artist.model.js";

export const getAllArtists = async (req, res, next) => {
  try {
    const artists = await Artist.find().sort({ name: 1 }); // sort theo tên
    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    next(error);
  }
};

export const getArtistById = async (req, res, next) => {
  try {
    const { artistId } = req.params;

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    res.status(200).json(artist);
  } catch (error) {
    console.error("Error fetching artist:", error);
    next(error);
  }
};
