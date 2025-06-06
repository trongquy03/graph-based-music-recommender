import { User } from "../models/user.model.js";

export const checkPremiumAccess = async (req, res, next) => {
  const userId = req.auth.userId;

  try {
    const user = await User.findOne({ clerkId: userId });

    // Hết hạn premium thì trở về free
    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      user.isPremium = false;
      user.subscriptionType = "free";
      await user.save();
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Lỗi checkPremiumAccess:", err);
    res.status(500).json({ message: "Lỗi kiểm tra tài khoản Premium" });
  }
};
