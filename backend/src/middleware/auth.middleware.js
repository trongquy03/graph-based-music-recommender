import { clerkClient } from "@clerk/express";

export const protectRoute = async (req, res, next) => {
    if (!req.auth.userId) {
        return res.status(401).json({message: "Unauthorized - you must be logged in"});
        
    }

    next();
};

export const requireAdmin = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.auth.userId);
    const role = currentUser.publicMetadata?.role;

    if (role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized - admin only" });
    }

    next();
  } catch (error) {
    next(error);
  }
};


