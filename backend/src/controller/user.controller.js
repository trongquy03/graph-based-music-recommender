import {User} from "../models/user.model.js";
import {Message} from "../models/message.model.js";

export const getAllUsers = async (req, res, next) => {
    try {
        const currentUserId = req.auth.userId
        const users = await User.find({clerkId: {$ne: currentUserId}});
        res.status(200).json(users);
    } catch (error) {
        next(error)
    }
};

export const getFollowedArtists = async (req, res) => {
  const userId = req.auth?.userId;

  try {
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId }).populate("followedArtists");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      count: user.followedArtists.length,
      artists: user.followedArtists,
    });
  } catch (error) {
    console.error("Error fetching followed artists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

		const messages = await Message.find({
			$or: [
				{ senderId: userId, receiverId: myId },
				{ senderId: myId, receiverId: userId },
			],
		}).sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		next(error);
	}
};

export const getPremiumStatus = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const now = new Date();
    let isPremium = user.isPremium;

    // Nếu đã hết hạn → cập nhật lại luôn trong DB
    if (user.premiumUntil && new Date(user.premiumUntil) < now) {
      isPremium = false;

      // Cập nhật trạng thái user
      user.isPremium = false;
      user.subscriptionType = "free";
      await user.save(); 
    }

    return res.json({
      isPremium,
      subscriptionType: user.subscriptionType,
      premiumUntil: user.premiumUntil,
    });
  } catch (err) {
    console.error("Lỗi getPremiumStatus", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
