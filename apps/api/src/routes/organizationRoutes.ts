
import { Router } from "express";
import { z } from "zod";
import { Organization } from "../models/Organization";

const router = Router();

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).min(2),
  description: z.string().max(500).optional()
});

// POST /api/organizations
router.post("/", async (req, res) => {
  const parsed = createOrganizationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      errors: parsed.error.flatten()
    });
    return;
  }

  try {
    const organization = await Organization.create(parsed.data);

    res.status(201).json({
      success: true,
      data: organization
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "Organization slug already exists"
      });
      return;
    }

    console.error("Error creating organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// GET /api/organizations
router.get("/", async (_req, res) => {
  try {
    const organizations = await Organization.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

export default router;
