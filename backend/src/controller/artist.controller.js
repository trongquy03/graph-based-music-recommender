import { Artist } from "../models/artist.model.js";
import { User } from "../models/user.model.js";
import { neo4jDriver } from "../lib/db.js";


// Get all artists
export const getAllArtists = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await Artist.countDocuments(query);
    const artists = await Artist.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: artists,
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    next(error);
  }
};


// Get artist by ID
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

// Follow Artist
export const followArtist = async (req, res) => {
  const session = neo4jDriver.session();
  const { artistId } = req.params;
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const artist = await Artist.findByIdAndUpdate(
      artistId,
      { $addToSet: { followers: userId } },
      { new: true }
    );
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $addToSet: { followedArtists: artist._id } }
    );

    await session.run(
      `MERGE (u:User {id: $userId})
       MERGE (a:Artist {id: $artistId})
       MERGE (u)-[:FOLLOWS]->(a)`,
      { userId, artistId }
    );

    return res.status(200).json({ message: "Followed artist", artist });
  } catch (error) {
    console.error("Error following artist:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await session.close();
  }
};

// Unfollow Artist
export const unfollowArtist = async (req, res) => {
  const session = neo4jDriver.session();
  const { artistId } = req.params;
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const artist = await Artist.findByIdAndUpdate(
      artistId,
      { $pull: { followers: userId } },
      { new: true }
    );
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { followedArtists: artist._id } }
    );

    await session.run(
      `MATCH (u:User {id: $userId})-[r:FOLLOWS]->(a:Artist {id: $artistId})
       DELETE r`,
      { userId, artistId }
    );

    return res.status(200).json({ message: "Unfollowed artist", artist });
  } catch (error) {
    console.error("Error unfollowing artist:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await session.close();
  }
};

// Get followers count
export const getArtistFollowersCount = async (req, res) => {
  const { artistId } = req.params;

  try {
    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    return res.status(200).json({ followers: artist.followers.length });
  } catch (error) {
    console.error("Error getting followers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if current user is following the artist
export const isFollowingArtist = async (req, res) => {
  const { artistId } = req.params;
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const isFollowing = artist.followers.includes(userId);
    return res.status(200).json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ message: "Server error" });
  } 
};

// Get all artists the user is following
export const getFollowedArtists = async (req, res) => {
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId }).populate("followedArtists");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ artists: user.followedArtists });
  } catch (error) {
    console.error("Error fetching followed artists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFollowedArtistsCount = async (req, res) => {
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ count: user.followedArtists.length });
  } catch (error) {
    console.error("Error getting followed artist count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const getRecommendedArtistsForUser = async (req, res) => {
//   const session = neo4jDriver.session();
//   const userId = req.auth?.userId;

//   try {
//     if (!userId) return res.status(401).json({ message: "Unauthorized" });

//     const query = `
//       MATCH (u:User {id: $userId})-[:FOLLOWS]->(a1:Artist)
//       WITH collect(a1) AS followed
//       CALL {
//         WITH followed
//         CALL gds.nodeSimilarity.stream('artist-similarity-graph', {
//           relationshipWeightProperty: 'weight'
//         })
//         YIELD node1, node2, similarity
//         WITH gds.util.asNode(node1) AS a1, gds.util.asNode(node2) AS a2, similarity, followed
//         WHERE a1 IN followed AND NOT a2 IN followed
//         RETURN DISTINCT a2.id AS artistId, similarity
//         ORDER BY similarity DESC
//         LIMIT 20
//       }
//       RETURN artistId, similarity
//     `;

//     const result = await session.run(query, { userId });
//     let idsWithScores = result.records.map((r) => ({
//       id: r.get("artistId"),
//       similarity: r.get("similarity"),
//     }));

//     // Fallback nếu không có artist nào được gợi ý
//     if (idsWithScores.length === 0) {
//       const fallbackArtists = await Artist.find({})
//         .sort({ followers: -1 }) // follower count từ Mongo
//         .limit(20);

//       return res.status(200).json({
//         data: fallbackArtists.map((a) => ({
//           id: a._id.toString(),
//           name: a.name,
//           imageUrl: a.imageUrl,
//           score: a.rating || null,
//           similarity: null,
//         })),
//       });
//     }

//     const mongoArtists = await Artist.find({ _id: { $in: idsWithScores.map((x) => x.id) } });
//     const merged = idsWithScores.map((rec) => {
//       const details = mongoArtists.find((a) => a._id.toString() === rec.id);
//       return details ? {
//         id: rec.id,
//         name: details.name,
//         imageUrl: details.imageUrl,
//         score: details.rating || null,
//         similarity: rec.similarity,
//       } : null;
//     }).filter(Boolean);

//     res.status(200).json({ data: merged });
//   } catch (error) {
//     console.error("Error recommending artists:", error);
//     res.status(500).json({ message: "Server error" });
//   } finally {
//     await session.close();
//   }
// };

export const getRecommendedArtistsForUser = async (req, res) => {
  const session = neo4jDriver.session();
  const userId = req.auth?.userId;

  try {
    // Nếu đã đăng nhập → dùng nodeSimilarity như cũ
    if (userId) {
      const query = `
        MATCH (u:User {id: $userId})-[:FOLLOWS]->(a1:Artist)
        WITH collect(a1) AS followed
        CALL {
          WITH followed
          CALL gds.nodeSimilarity.stream('artist-similarity-graph', {
            relationshipWeightProperty: 'weight'
          })
          YIELD node1, node2, similarity
          WITH gds.util.asNode(node1) AS a1, gds.util.asNode(node2) AS a2, similarity, followed
          WHERE a1 IN followed AND NOT a2 IN followed
          RETURN DISTINCT a2.id AS artistId, similarity
          ORDER BY similarity DESC
          LIMIT 20
        }
        RETURN artistId, similarity
      `;

      const result = await session.run(query, { userId });
      let idsWithScores = result.records.map((r) => ({
        id: r.get("artistId"),
        similarity: r.get("similarity"),
      }));

      // Fallback nếu không có gợi ý
      if (idsWithScores.length === 0) {
        const fallbackArtists = await Artist.find({})
          .sort({ followers: -1 })
          .limit(20);
        return res.status(200).json({
          data: fallbackArtists.map((a) => ({
            id: a._id.toString(),
            name: a.name,
            imageUrl: a.imageUrl,
            score: a.rating || null,
            similarity: null,
          })),
        });
      }

      const mongoArtists = await Artist.find({ _id: { $in: idsWithScores.map((x) => x.id) } });
      const merged = idsWithScores.map((rec) => {
        const details = mongoArtists.find((a) => a._id.toString() === rec.id);
        return details ? {
          id: rec.id,
          name: details.name,
          imageUrl: details.imageUrl,
          score: details.rating || null,
          similarity: rec.similarity,
        } : null;
      }).filter(Boolean);

      return res.status(200).json({ data: merged });
    }

    // Nếu chưa đăng nhập → dùng PageRank để gợi ý artist phổ biến
    const pagerankQuery = `
      CALL gds.pageRank.stream('artist-pagerank-graph')
      YIELD nodeId, score
      RETURN gds.util.asNode(nodeId).id AS artistId, score
      ORDER BY score DESC
      LIMIT 20
    `;

    const result = await session.run(pagerankQuery);
    const idsWithScores = result.records.map((r) => ({
      id: r.get("artistId"),
      score: r.get("score"),
    }));

    const mongoArtists = await Artist.find({ _id: { $in: idsWithScores.map((x) => x.id) } });
    const merged = idsWithScores.map((rec) => {
      const details = mongoArtists.find((a) => a._id.toString() === rec.id);
      return details ? {
        id: rec.id,
        name: details.name,
        imageUrl: details.imageUrl,
        score: details.rating || null,
        pagerank: rec.score,
      } : null;
    }).filter(Boolean);

    return res.status(200).json({ data: merged });
  } catch (error) {
    console.error("Error recommending artists:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await session.close();
  }
};


export const getSimilarArtists = async (req, res) => {
  const session = neo4jDriver.session();
  const { artistId } = req.params;

  try {
    const query = `
      MATCH (a1:Artist {id: $artistId})
      CALL gds.nodeSimilarity.stream('artist-similarity-graph', {
        relationshipWeightProperty: 'weight'
      })
      YIELD node1, node2, similarity
      WITH gds.util.asNode(node1) AS a1, gds.util.asNode(node2) AS a2, similarity
      WHERE a1.id = $artistId
      RETURN a2.id AS artistId, similarity
      ORDER BY similarity DESC
      LIMIT 20
    `;

    const result = await session.run(query, { artistId });
    const idsWithScores = result.records.map((r) => ({
      id: r.get("artistId"),
      similarity: r.get("similarity"),
    }));

    const mongoArtists = await Artist.find({ _id: { $in: idsWithScores.map((x) => x.id) } });
    const merged = idsWithScores.map((rec) => {
      const details = mongoArtists.find((a) => a._id.toString() === rec.id);
      return details ? {
        _id: details._id.toString(), 
        name: details.name,
        imageUrl: details.imageUrl,
        score: details.rating || null,
        similarity: rec.similarity,
      } : null;

    }).filter(Boolean);

    res.status(200).json({ data: merged });
  } catch (error) {
    console.error("Error fetching similar artists:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await session.close();
  }
};


