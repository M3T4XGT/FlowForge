
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDatabase } from "./config/db";
import { configureSession } from "./config/session";

import authRoutes from "./routes/authRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import { requireAuth } from "./middleware/requireAuth";
import memberRoutes from "./routes/memberRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigin = "http://localhost:5173";

// =====================================
// Security Middleware
// =====================================

app.use(helmet());

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

// Reject unexpected origins for API writes.
// This is a local development safeguard.
app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;

  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    origin &&
    origin !== allowedOrigin
  ) {
    res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
    return;
  }

  next();
});

app.use(configureSession());

// =====================================
// Health Check
// =====================================

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    application: "FlowForge API",
    status: connected ? "running" : "database unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

// =====================================
// Authentication APIs
// =====================================

app.use("/api/auth", authRoutes);

// Existing organization routes.
// Still development-only until RBAC is added.

app.use("/api/auth", authRoutes);

// Organization member management
app.use(
  "/api/organizations/:organizationId/members",
  requireAuth,
  memberRoutes
);

// Organization management
app.use(
  "/api/organizations",
  requireAuth,
  organizationRoutes
);


// =====================================
// 404 Handler
// =====================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// =====================================
// Start Application
// =====================================

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, "127.0.0.1", () => {
      console.log("=================================");
      console.log("FlowForge Backend Running");
      console.log(`http://localhost:${PORT}`);
      console.log("MongoDB: Connected");
      console.log("Authentication API: Enabled");
      console.log("=================================");
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
