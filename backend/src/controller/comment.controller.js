import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";

// Tạo comment mới
export const createComment = async (req, res) => {
  try {
    const { songId, text, parent } = req.body;
    const clerkId = req.auth?.userId;

    console.log("POST /comments", { songId, text, parent, clerkId });

    if (!text || !songId || !clerkId) {
      return res.status(400).json({ message: "Missing required fields." });
    }


    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const comment = await Comment.create({
      user: user._id, 
      song: songId,
      text,
      parent: parent || null,
    });

    const newComment = await Comment.findById(comment._id)
      .populate("user", "fullName imageUrl clerkId");

    res.status(201).json(newComment);
  } catch (error) {
    console.error(" createComment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cập nhật comment của chính mình
export const updateComment = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    const { id } = req.params;
    const { text } = req.body;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(403).json({ message: "User not found" });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // So sánh _id thực sự
    if (comment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to edit this comment" });
    }

    comment.text = text;
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    console.error("updateComment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const deleteComment = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    const { id } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(403).json({ message: "User not found" });

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to delete this comment" });
    }

    await Comment.deleteOne({ _id: id });
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error(" deleteComment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Lấy tất cả comment theo bài hát
export const getCommentsBySong = async (req, res) => {
  const { songId } = req.params;
  const comments = await Comment.find({ song: songId })
    .populate("user", "fullName imageUrl")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(comments);
};
