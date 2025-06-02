import { Album } from "../models/album.model.js";

export const getAllAlbums = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: "artists",
          localField: "artist",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { "artist.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const [albums, totalCount] = await Promise.all([
      Album.aggregate(pipeline),
      Album.aggregate([
        {
          $lookup: {
            from: "artists",
            localField: "artist",
            foreignField: "_id",
            as: "artist",
          },
        },
        { $unwind: "$artist" },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { title: { $regex: search, $options: "i" } },
                    { "artist.name": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        { $count: "total" },
      ]),
    ]);

    const total = totalCount[0]?.total || 0;

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: albums,
    });
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