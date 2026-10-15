
import { Router } from "express";
import argon2 from "argon2";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { User } from "../models/User";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid registration details",
    });
    return;
  }

  try {
    const { name, email, password } = parsed.data;

    const existingUser = await User.exists({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    // Explicit login required after registration.
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: publicUser(user),
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    console.error("Registration failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to register account",
    });
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid login details",
    });
    return;
  }

  try {
    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select(
      "+passwordHash"
    );

    if (
      !user ||
      !user.isActive ||
      !(await argon2.verify(user.passwordHash, password))
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration failed:", error);
        res.status(500).json({
          success: false,
          message: "Unable to establish session",
        });
        return;
      }

      req.session.userId = String(user._id);

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);
          res.status(500).json({
            success: false,
            message: "Unable to establish session",
          });
          return;
        }

        res.json({
          success: true,
          message: "Login successful",
          user: publicUser(user),
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
    return;
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
      return;
    }

    res.json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Unable to retrieve account:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve account",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
      return;
    }

    res.clearCookie("flowforge.sid");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

export default router;
