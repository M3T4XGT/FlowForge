
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Organization } from "../models/Organization";
import { Membership } from "../models/Membership";

const router = Router();

const organizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional(),
});

// GET /api/organizations
// Return organizations belonging to the current user.
router.get("/", async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const memberships = await Membership.find({
      userId,
    }).select("organizationId");

    const organizationIds = memberships.map(
      (membership) => membership.organizationId
    );

    const organizations = await Organization.find({
      _id: { $in: organizationIds },
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("Failed to list organizations:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch organizations",
    });
  }
});

// POST /api/organizations
// Creator automatically becomes owner.
router.post("/", async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const parsed = organizationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid organization details",
    });
    return;
  }

  const dbSession = await mongoose.startSession();

  try {
    let organizationId: mongoose.Types.ObjectId | undefined;

    await dbSession.withTransaction(async () => {
      const [organization] = await Organization.create(
        [parsed.data],
        { session: dbSession }
      );

      await Membership.create(
        [{
          userId: new mongoose.Types.ObjectId(userId),
          organizationId: organization._id,
          role: "owner",
        }],
        { session: dbSession }
      );

      organizationId = organization._id;
    });

    const organization = await Organization.findById(
      organizationId
    );

    res.status(201).json({
      success: true,
      data: organization,
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
        message: "Organization slug already exists",
      });
      return;
    }

    console.error("Organization creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create organization",
    });
  } finally {
    await dbSession.endSession();
  }
});

export default router;
