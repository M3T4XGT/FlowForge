
import {
  Router,
  type RequestHandler,
} from "express";

import mongoose from "mongoose";
import { z } from "zod";

import { Membership } from "../models/Membership";
import { Organization } from "../models/Organization";
import { User } from "../models/User";

// ==========================================
// Route Types
// ==========================================

type MemberRouteParams = {
  organizationId: string;
};

type MemberRole = "owner" | "admin" | "manager" | "employee";

type MemberLocals = {
  memberRole: MemberRole;
};

// ==========================================
// Router Configuration
// ==========================================

const router = Router({
  mergeParams: true,
});

// ==========================================
// Request Validation
// ==========================================

const addMemberSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(["admin", "manager", "employee"]),
});

// ==========================================
// Membership Verification Middleware
// ==========================================

const verifyMembership: RequestHandler<
  MemberRouteParams,
  unknown,
  unknown,
  Record<string, never>,
  MemberLocals
> = async (req, res, next) => {
  const userId = req.session.userId;
  const organizationId = req.params.organizationId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (!mongoose.isValidObjectId(organizationId)) {
    res.status(400).json({
      success: false,
      message: "Invalid organization ID",
    });
    return;
  }

  try {
    const organization = await Organization.exists({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
      });
      return;
    }

    const membership = await Membership.findOne({
      userId,
      organizationId,
    });

    if (!membership) {
      res.status(404).json({
        success: false,
        message: "Organization not found",
      });
      return;
    }

    res.locals.memberRole = membership.role;

    next();
  } catch (error) {
    next(error);
  }
};

router.use(verifyMembership);

// ==========================================
// GET /api/organizations/:organizationId/members
// List Organization Members
// ==========================================

const listMembers: RequestHandler<
  MemberRouteParams,
  unknown,
  unknown,
  Record<string, never>,
  MemberLocals
> = async (req, res, next) => {
  try {
    const members = await Membership.find({
      organizationId: req.params.organizationId,
    })
      .populate("userId", "name email isActive")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

router.get("/", listMembers);

// ==========================================
// POST /api/organizations/:organizationId/members
// Add Existing Registered User
// ==========================================

const addMember: RequestHandler<
  MemberRouteParams,
  unknown,
  unknown,
  Record<string, never>,
  MemberLocals
> = async (req, res, next) => {
  const actorRole = res.locals.memberRole;

  // Only owners and admins can add members
  if (!["owner", "admin"].includes(actorRole)) {
    res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
    return;
  }

  const parsed = addMemberSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid member details",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  // Only owners can assign the admin role
  if (
    parsed.data.role === "admin" &&
    actorRole !== "owner"
  ) {
    res.status(403).json({
      success: false,
      message: "Only owners can assign administrators",
    });
    return;
  }

  try {
    const user = await User.findOne({
      email: parsed.data.email,
      isActive: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Registered user not found",
      });
      return;
    }

    // Prevent duplicate memberships
    const existing = await Membership.exists({
      userId: user._id,
      organizationId: req.params.organizationId,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "User is already a member",
      });
      return;
    }

    // Create membership
    const membership = await Membership.create({
      userId: user._id,
      organizationId: req.params.organizationId,
      role: parsed.data.role,
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: membership,
    });
  } catch (error: unknown) {
    // MongoDB duplicate key error
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "User is already a member",
      });
      return;
    }

    next(error);
  }
};

router.post("/", addMember);

export default router;
