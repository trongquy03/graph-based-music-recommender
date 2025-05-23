import express from "express";
import dotenv from "dotenv"
import { clerkMiddleware } from '@clerk/express'
import fileUpload from "express-fileupload"
import path from "path"
import cors from "cors"
import { createServer } from "http";

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

app.use(express.json()); // parse req.body
app.use(clerkMiddleware()); // auth request
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir: path.join(__dirname, "tmp"),
    createParentPath: true,
    limits: {
        fieldSize: 10 * 1024 * 1024 // max 10mb
        
    }
}))

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/artist", artistRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/history", historyRoutes);



// error handle
app.use((err,req,res,next) => {
    res.status(500).json({message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message});
})
httpServer.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connectDB();
})