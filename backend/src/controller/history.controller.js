import { ListeningHistory } from "../models/listeningHistory.model.js";
import { neo4jDriver } from "../lib/db.js";

// Ghi nhận một lần nghe
export const recordListening = async (req, res) => {
    const session = neo4jDriver.session();
    const userId = req.auth.userId;
    const { songId } = req.body;

    try {
        const history = new ListeningHistory({ user: userId, song: songId });
        await history.save();
        await session.run(
        `MERGE (u:User {id: $userId})
        MERGE (s:Song {id: $songId})
        MERGE (u)-[r:LISTENED]->(s)
        ON CREATE SET r.count = 1
        ON MATCH SET r.count = r.count + 1`,
        { userId, songId }
    );

        res.status(201).json({ message: "Listening recorded successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
};

// Lấy lịch sử nghe nhạc
export const getListeningHistory = async (req, res) => {
    const userId = req.auth.userId;

    try {
        const history = await ListeningHistory.find({ user: userId })
            .populate({
                path: "song",
                populate: { path: "artist", select: "name" },
            })
            .sort({ listenedAt: -1 });// mới nhất trước

        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
