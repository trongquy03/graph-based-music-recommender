import { Rating } from "../models/rating.model.js";

// Get all ratings by user
export const getRatings = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const ratings = await Rating.find({ user: userId }).populate("song");
        res.status(200).json(ratings);
    } catch (err) {
        next(err);
    }
};

// Rate or update a song
export const rateSong = async (req, res) => {
    const userId = req.auth.userId;
    const { songId, rating } = req.body;

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    try {
        const existingRating = await Rating.findOne({ user: userId, song: songId });

        if (existingRating) {
            existingRating.rating = rating;
            await existingRating.save();
            return res.status(200).json({ message: "Rating updated successfully!" });
        }

        const newRating = new Rating({ user: userId, song: songId, rating });
        await newRating.save();

        res.status(201).json({ message: "Song rated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
