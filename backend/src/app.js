// src/app.js -- Express app factory (no server.listen here).
// Keeping app creation separate from startup makes testing possible.
import express from "express";
import cors    from "cors";
import morgan  from "morgan";

import authRoutes        from "./modules/auth/auth.routes.js";
import taskRoutes        from "./modules/tasks/task.routes.js";
import reportRoutes      from "./modules/reports/report.routes.js";
import userRoutes        from "./modules/users/user.routes.js";
import leaderboardRoutes from "./modules/leaderboard/leaderboard.routes.js";
import { errorHandler }  from "./middleware/error.middleware.js";

const createApp = () => {
  const app = express();

  // ── Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── CORS
  // Allow CLIENT_ORIGIN env var (set this in Render dashboard to your frontend URL).
  // Falls back to allowing all origins in development.
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_ORIGIN
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // In production, check against allowedOrigins
      if (process.env.NODE_ENV === "production") {
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
      // In development, allow everything
      return callback(null, true);
    },
    credentials: true
  }));

  // ── Request logging (dev only)
  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

  // ── Health check
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", app: "PurplePulse Backend" })
  );

  // ── Feature routers
  app.use("/api/auth",        authRoutes);
  app.use("/api/tasks",       taskRoutes);
  app.use("/api/reports",     reportRoutes);
  app.use("/api/users",       userRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  // ── API 404 handler (catches unmatched /api/* routes before the catch-all)
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
  });

  // ── Central error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
