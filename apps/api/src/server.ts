
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDatabase } from "./config/db";
import organizationRoutes from "./routes/organizationRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ==========================================
// Middleware
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// ==========================================
// Health Check API
// GET /api/health
// ==========================================

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    application: "FlowForge API",
    status: connected ? "running" : "database unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

// ==========================================
// Organization API Routes
// ==========================================

// GET  /api/organizations
// POST /api/organizations

app.use("/api/organizations", organizationRoutes);

// ==========================================
// 404 Handler
// ==========================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ==========================================
// Start Server
// ==========================================

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log("====================================");
      console.log("FlowForge API started successfully");
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(
        `Organizations: http://localhost:${PORT}/api/organizations`
      );
      console.log("MongoDB: Connected");
      console.log("====================================");
    });
  } catch (error) {
    console.error("Failed to start FlowForge backend:", error);
    process.exit(1);
  }
}

startServer();
