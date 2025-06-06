
import express from "express";
import {
  createComment,
  updateComment,
  deleteComment,
  getCommentsBySong,
} from "../controller/comment.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, createComment);
router.put("/:id", protectRoute, updateComment);
router.delete("/:id", protectRoute, deleteComment);
router.get("/song/:songId", getCommentsBySong);

export default router;
