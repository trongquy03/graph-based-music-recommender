import { User } from "../models/user.model.js";
import { neo4jSession } from "../lib/db.js";

export const authCallback = async (req, res, next) => {
  try {
    const { id, firstName, lastName, imageUrl } = req.body;

    const user = await User.findOne({ clerkId: id });

    if (!user) {
      await User.create({
        clerkId: id,
        fullName: `${firstName || ""} ${lastName || ""}`.trim(),
        imageUrl
      });

      // Thêm vào Neo4j
      await neo4jSession.run(
        `MERGE (u:User {id: $id})
         SET u.name = $name, u.imageUrl = $imageUrl`,
        {
          id,
          name: `${firstName || ""} ${lastName || ""}`.trim(),
          imageUrl
        }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in auth callback", error);
    next(error);
  }
};
