import express from "express";
import dotenv from "dotenv"
import { clerkMiddleware } from '@clerk/express'
import fileUpload from "express-fileupload"
import path from "path"
import cors from "cors"
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";

import { initializeSocket } from "./lib/socket.js";

import userRoutes from "./routes/user.route.js"
import adminRoutes from "./routes/admin.route.js"
import authRoutes from "./routes/auth.route.js"
import albumRoutes from "./routes/album.route.js"
import songRoutes from "./routes/song.route.js"
import statRoutes from "./routes/stat.route.js"
import likeRoutes from "./routes/like.route.js"
import ratingRoutes from "./routes/rating.route.js"
import historyRoutes from "./routes/history.route.js"
import searchRoutes from "./routes/search.route.js"
import artistRoutes from "./routes/artist.route.js"
import playlistRoutes from "./routes/playlist.route.js"
import cloudinaryRoutes from "./routes/cloudinary.route.js"
import paymentRoutes from "./routes/payment.route.js"
import commentRoutes from "./routes/comment.route.js"
import aiChatRoutes from "./routes/aichat.route.js"
import generateRoutes from "./routes/generate.route.js"
import { connectDB } from "./lib/db.js";


dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 5000


const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(cors(
    {
        origin: "http://localhost:3000",
        credentials: true
    }
))

app.use(express.json());
app.use(clerkMiddleware());
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir: path.join(__dirname, "tmp"),
    createParentPath: true,
    limits: {
        fieldSize: 10 * 1024 * 1024 // max 10mb
        
    }
}))

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
	if (fs.existsSync(tempDir)) {
		fs.readdir(tempDir, (err, files) => {
			if (err) {
				console.log("error", err);
				return;
			}
			for (const file of files) {
				fs.unlink(path.join(tempDir, file), (err) => {});
			}
		});
	}
});


app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/artist", artistRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
	});
}

// error handle
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err); 
    }
    res.status(500).json({
        message: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message
    });
});

httpServer.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connectDB();
})