
import type { RequestHandler } from "express";
import { User } from "../models/User";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Invalid or inactive account",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Authentication middleware failed:", error);

    res.status(500).json({
      success: false,
      message: "Authentication verification failed",
    });
  }
};
